# 4.3.2 Cognito Authentication

NutriTrack supports two sign-in methods: email + password with an OTP verification step, and Google OAuth through the Cognito Hosted UI. Both land the user in the same Cognito User Pool and mint the same JWT shape, so the rest of the app (AppSync authorization, Lambda `event.identity`, S3 prefix scoping) does not care which method the user picked.

This section covers the real `auth/resource.ts`, the Google Cloud Console setup, the secret injection, and the error cases the frontend has to handle.

## The resource file

Replace `backend/amplify/auth/resource.ts` with the exact NutriTrack configuration:

```typescript
import { defineAuth, secret } from "@aws-amplify/backend";

export const auth = defineAuth({

  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),
        scopes: ['email', 'profile', 'openid']
      },
      callbackUrls: [
        'nutritrack://',
        'http://localhost:8081/',
        'https://nutri-track.link/',
        'https://feat-phase3-frontend-integration.d1glc6vvop0xlb.amplifyapp.com/'
      ],
      logoutUrls: [
        'nutritrack://',
        'http://localhost:8081/',
        'https://nutri-track.link/',
        'https://feat-phase3-frontend-integration.d1glc6vvop0xlb.amplifyapp.com/'
      ]
    }
  },

  userAttributes: {
    email: {
      required: true
    },
    preferredUsername: {
      required: false
    }
  },
});
```

### Line-by-line walkthrough

**`loginWith.email: true`**
Creates a Cognito User Pool with email as the sign-in username. Amplify Gen 2 enables the default email verification flow: on sign-up Cognito emails a six-digit code, the client calls `confirmSignUp({ username, confirmationCode })`, and only then can the user sign in. No password reset customization is needed — the hosted UI and the SDK both use the built-in flow.

**`externalProviders.google`**
Registers Google as a federated identity provider. Amplify injects the client ID and secret as CloudFormation parameters resolved from AWS Systems Manager Parameter Store at deploy time. `secret('GOOGLE_CLIENT_ID')` does **not** bake the value into the synthesized template — it stores a reference that resolves only inside the sandbox account.

**`scopes: ['email', 'profile', 'openid']`**
These are the minimum scopes required for Cognito to create a User Pool user from a Google identity:

- `openid` — required for any OIDC flow; returns the `sub` claim used as the Cognito external identity key.
- `email` — required because `email` is a required user attribute in this pool. Without it, Cognito refuses to create the federated user.
- `profile` — returns `name` and `picture`, which the app uses to pre-fill the profile screen.

We do **not** request `https://www.googleapis.com/auth/fitness.*` or any Google API scopes — NutriTrack does not integrate Google Fit.

**`callbackUrls`** and **`logoutUrls`**
These four URLs are registered on the Cognito App Client as allowed redirect targets. Any attempt by the hosted UI to redirect somewhere not in this list returns `redirect_mismatch`.

| URL | Purpose |
| --- | --- |
| `nutritrack://` | Deep link scheme for native iOS/Android Expo builds. Configured in `frontend/app.json` under `expo.scheme`. |
| `http://localhost:8081/` | Expo web dev server default port. Used for browser debugging. |
| `https://nutri-track.link/` | Production custom domain fronting the Amplify Hosting distribution. |
| `https://feat-phase3-frontend-integration.d1glc6vvop0xlb.amplifyapp.com/` | Feature branch deploy preview on Amplify Hosting. |

The logout URL list mirrors the callback list — Cognito requires both sides to match when the hosted UI performs a global sign-out.

**`userAttributes.email.required: true`**
Email is written to the User Pool user profile and mirrored as a claim in every ID token. `preferredUsername` is optional and used later by the profile screen.

## Step 1: Create the Google OAuth client

Go to the Google Cloud Console → **APIs & Services → Credentials → Create Credentials → OAuth client ID**.

1. **Application type**: Web application. (Mobile OAuth clients are **not** used — Cognito brokers the redirect, not the native app.)
2. **Name**: `NutriTrack Cognito Sandbox` (or whatever identifies this environment).
3. **Authorized JavaScript origins**: leave empty.
4. **Authorized redirect URIs**: add exactly one URI, the Cognito Hosted UI callback. You will not know the exact value until after the first deploy, because Amplify auto-generates the Cognito domain. It looks like this:

   ```text
   https://<cognito-domain-prefix>.auth.ap-southeast-2.amazoncognito.com/oauth2/idpresponse
   ```

   You can find the prefix in `amplify_outputs.json` → `auth.oauth.domain`, or in the Cognito console under **App integration → Domain**.

5. Click **Create**, copy the **Client ID** and **Client Secret**.

![Google Cloud OAuth client configuration](images/gcp-oauth-client.png)

## Step 2: Store the secrets in the Amplify sandbox

From `backend/`, with the sandbox either running or stopped:

```bash
npx ampx sandbox secret set GOOGLE_CLIENT_ID
# paste the client ID when prompted, press Enter

npx ampx sandbox secret set GOOGLE_CLIENT_SECRET
# paste the client secret, press Enter
```

Verify:

```bash
npx ampx sandbox secret list
```

You should see both keys listed (values are not shown). The secrets are stored in AWS Systems Manager Parameter Store under `/amplify/<app-id>/<sandbox-identifier>/GOOGLE_CLIENT_ID` as a `SecureString`.

For branch deploys (`feat/phase3`, `main`) use the branch-scoped variant instead:

```bash
npx ampx secret set GOOGLE_CLIENT_ID --branch main
```

## Step 3: Re-deploy the sandbox

If the sandbox is already running, the file watcher picks up the edit to `auth/resource.ts` automatically and re-deploys in 15 to 40 seconds. If it is stopped:

```bash
npx ampx sandbox
```

Watch the CloudFormation events — you should see the Cognito `UserPoolIdentityProvider` resource being created with type `Google`.

![Cognito User Pool after deploy](images/cognito-user-pool.png)

Then regenerate `amplify_outputs.json`:

```bash
npx ampx generate outputs --outputs-out-dir ../frontend
```

The new file has an `auth.oauth` block with the Cognito domain and the configured scopes.

## Step 4: Add the Cognito domain to Google

Now that the sandbox has created the Cognito Hosted UI domain, go back to the Google OAuth client you made in Step 1 and add the real redirect URI:

```text
https://<actual-domain-prefix>.auth.ap-southeast-2.amazoncognito.com/oauth2/idpresponse
```

Save. Google takes up to five minutes to propagate the change.

## Frontend integration

The Expo app wires up Amplify Auth in `frontend/src/lib/amplify.ts` and calls `signInWithRedirect` from `aws-amplify/auth`:

```typescript
import { signInWithRedirect, signIn, signUp, confirmSignUp } from 'aws-amplify/auth';

// Google OAuth
await signInWithRedirect({ provider: 'Google' });

// Email sign-up
await signUp({
  username: email,
  password,
  options: { userAttributes: { email } },
});

// OTP verification
await confirmSignUp({ username: email, confirmationCode: otp });

// Email sign-in
await signIn({ username: email, password });
```

`signInWithRedirect` opens the Cognito Hosted UI (on web) or an in-app browser (on native via `expo-web-browser`), Cognito redirects to Google, and Google redirects back to Cognito which finally redirects back to one of the `callbackUrls` declared in `auth/resource.ts`.

## Auth guard pattern

`frontend/app/_layout.tsx` runs an auth guard that subscribes to `Hub.listen('auth')` and the current user state. Unauthenticated users are redirected to `/welcome`:

```tsx
import { useEffect } from 'react';
import { router } from 'expo-router';
import { getCurrentUser } from 'aws-amplify/auth';

useEffect(() => {
  getCurrentUser()
    .then(() => { /* authenticated — stay */ })
    .catch(() => router.replace('/welcome'));
}, []);
```

The guard runs on every mount of the root layout, so a dropped session (e.g., a revoked refresh token) kicks the user out of the tabs back to `/welcome` on next navigation.

## Sign-up flow and error codes

The email sign-up flow is three screens: `signup` → `verify-otp` → `(tabs)/home`. The frontend has to handle three Cognito errors explicitly:

| Exception | When | Frontend behavior |
| --- | --- | --- |
| `UserNotFoundException` | Login attempt, email has never signed up | Route to `/signup` with the email prefilled |
| `UserNotConfirmedException` | Login attempt, user exists but never entered OTP | Call `resendSignUpCode`, then route to `/verify-otp` |
| `NotAuthorizedException` | Login attempt, wrong password | Show inline error on the password field |

All three come from `aws-amplify/auth` as thrown errors with a `name` property matching the exception name above.

![OTP email sent by Cognito](images/otp-email.png)

## Testing end to end

With the sandbox running and the Expo web dev server up (`cd ../frontend && npm run web`):

1. Open `http://localhost:8081/`.
2. Tap **Sign up**, enter a real email you can check, pick a password meeting the default Cognito policy (8+ chars, 1 upper, 1 lower, 1 digit, 1 symbol).
3. Check your inbox for the six-digit code (subject: "Your verification code").
4. Enter the code on the `verify-otp` screen.
5. You should land in `(tabs)/home`.

Then test the Google path:

1. Sign out (`signOut()` from `aws-amplify/auth`).
2. On `/welcome`, tap **Continue with Google**.
3. Complete the Google consent screen.
4. You should be redirected back to `http://localhost:8081/` and land in `(tabs)/home`.

If either path fails, check the browser devtools network tab for the `/oauth2/idpresponse` or `/oauth2/token` call and inspect the error body. Most failures at this stage are either a missing redirect URI in Google, or a wrong Cognito domain in Google's console.

Continue to [4.3.3 S3 Storage](../4.3.3-S3-Storage/).
