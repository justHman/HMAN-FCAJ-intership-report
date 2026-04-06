# 4.3.2 Xác thực Cognito

NutriTrack hỗ trợ hai cách đăng nhập: email + mật khẩu kèm bước xác minh OTP, và Google OAuth qua Cognito Hosted UI. Cả hai đều đưa người dùng vào cùng một Cognito User Pool và phát ra cùng một dạng JWT, nên phần còn lại của ứng dụng (AppSync authorization, `event.identity` trong Lambda, scope prefix S3) không quan tâm user đã chọn phương thức nào.

Mục này trình bày file `auth/resource.ts` thật, cấu hình trong Google Cloud Console, cách inject secret, và các trường hợp lỗi frontend phải xử lý.

## File resource

Thay `backend/amplify/auth/resource.ts` bằng cấu hình NutriTrack chính xác:

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

### Giải thích từng dòng

**`loginWith.email: true`**
Tạo một Cognito User Pool dùng email làm username. Amplify Gen 2 bật luồng xác minh email mặc định: khi sign-up Cognito gửi email mã sáu chữ số, client gọi `confirmSignUp({ username, confirmationCode })`, rồi user mới được sign in. Không cần tùy biến luồng reset password — hosted UI và SDK đều dùng luồng có sẵn.

**`externalProviders.google`**
Đăng ký Google làm federated identity provider. Amplify inject client ID và secret dưới dạng tham số CloudFormation resolve từ AWS Systems Manager Parameter Store khi deploy. `secret('GOOGLE_CLIENT_ID')` **không** nhúng giá trị vào template đã synth — nó chỉ lưu một tham chiếu, resolve trong tài khoản sandbox.

**`scopes: ['email', 'profile', 'openid']`**
Đây là các scope tối thiểu để Cognito tạo được user User Pool từ một danh tính Google:

- `openid` — bắt buộc cho mọi luồng OIDC; trả claim `sub` dùng làm external identity key của Cognito.
- `email` — bắt buộc vì `email` là thuộc tính required trong pool này. Thiếu scope này Cognito từ chối tạo user federated.
- `profile` — trả `name` và `picture`, app dùng để pre-fill màn hình profile.

Ta **không** xin `https://www.googleapis.com/auth/fitness.*` hay bất kỳ scope Google API nào — NutriTrack không tích hợp Google Fit.

**`callbackUrls`** và **`logoutUrls`**
Bốn URL này được đăng ký trên Cognito App Client như redirect target hợp lệ. Mọi redirect từ hosted UI tới địa chỉ ngoài danh sách này đều trả `redirect_mismatch`.

| URL | Mục đích |
| --- | --- |
| `nutritrack://` | Deep link scheme cho build Expo native iOS/Android. Khai báo ở `frontend/app.json` trong `expo.scheme`. |
| `http://localhost:8081/` | Cổng mặc định của Expo web dev server. Dùng để debug trình duyệt. |
| `https://nutri-track.link/` | Domain custom production front cho Amplify Hosting distribution. |
| `https://feat-phase3-frontend-integration.d1glc6vvop0xlb.amplifyapp.com/` | Preview deploy của feature branch trên Amplify Hosting. |

Danh sách logout phải khớp với callback — Cognito yêu cầu cả hai khớp khi hosted UI thực hiện global sign-out.

**`userAttributes.email.required: true`**
Email được ghi vào user profile của User Pool và mirror vào claim trong mọi ID token. `preferredUsername` là tùy chọn, màn hình profile dùng sau.

## Bước 1: Tạo Google OAuth client

Vào Google Cloud Console → **APIs & Services → Credentials → Create Credentials → OAuth client ID**.

1. **Application type**: Web application. (OAuth client cho Mobile **không** được dùng — Cognito đứng giữa redirect, không phải app native.)
2. **Name**: `NutriTrack Cognito Sandbox` (hoặc bất cứ tên nào định danh môi trường này).
3. **Authorized JavaScript origins**: để trống.
4. **Authorized redirect URIs**: thêm đúng một URI, chính là callback của Cognito Hosted UI. Bạn chưa biết giá trị chính xác cho tới khi deploy xong lần đầu, vì Amplify tự sinh domain Cognito. Dạng của nó:

   ```text
   https://<cognito-domain-prefix>.auth.ap-southeast-2.amazoncognito.com/oauth2/idpresponse
   ```

   Bạn tìm prefix trong `amplify_outputs.json` → `auth.oauth.domain`, hoặc trong Cognito console tại **App integration → Domain**.

5. Bấm **Create**, copy **Client ID** và **Client Secret**.

![Cấu hình OAuth client trên Google Cloud](images/gcp-oauth-client.png)

## Bước 2: Lưu secret vào sandbox Amplify

Từ `backend/`, sandbox có thể đang chạy hoặc đã dừng:

```bash
npx ampx sandbox secret set GOOGLE_CLIENT_ID
# paste client ID khi được hỏi, Enter

npx ampx sandbox secret set GOOGLE_CLIENT_SECRET
# paste client secret, Enter
```

Kiểm tra:

```bash
npx ampx sandbox secret list
```

Bạn sẽ thấy cả hai key (giá trị không hiển thị). Secret lưu trong AWS Systems Manager Parameter Store tại `/amplify/<app-id>/<sandbox-identifier>/GOOGLE_CLIENT_ID` dưới dạng `SecureString`.

Với branch deploy (`feat/phase3`, `main`) dùng biến thể gắn branch:

```bash
npx ampx secret set GOOGLE_CLIENT_ID --branch main
```

## Bước 3: Re-deploy sandbox

Nếu sandbox đã chạy, file watcher tự phát hiện thay đổi `auth/resource.ts` và re-deploy trong 15–40 giây. Nếu đã dừng:

```bash
npx ampx sandbox
```

Theo dõi event CloudFormation — bạn sẽ thấy resource `UserPoolIdentityProvider` của Cognito được tạo với type `Google`.

![Cognito User Pool sau khi deploy](images/cognito-user-pool.png)

Sau đó regenerate `amplify_outputs.json`:

```bash
npx ampx generate outputs --outputs-out-dir ../frontend
```

File mới có block `auth.oauth` chứa domain Cognito và các scope đã cấu hình.

## Bước 4: Thêm domain Cognito vào Google

Sau khi sandbox đã tạo xong Cognito Hosted UI domain, quay lại Google OAuth client ở Bước 1 và thêm redirect URI thật:

```text
https://<actual-domain-prefix>.auth.ap-southeast-2.amazoncognito.com/oauth2/idpresponse
```

Lưu. Google mất đến năm phút để lan truyền thay đổi.

## Tích hợp frontend

Expo app cấu hình Amplify Auth trong `frontend/src/lib/amplify.ts` và gọi `signInWithRedirect` từ `aws-amplify/auth`:

```typescript
import { signInWithRedirect, signIn, signUp, confirmSignUp } from 'aws-amplify/auth';

// Google OAuth
await signInWithRedirect({ provider: 'Google' });

// Đăng ký bằng email
await signUp({
  username: email,
  password,
  options: { userAttributes: { email } },
});

// Xác minh OTP
await confirmSignUp({ username: email, confirmationCode: otp });

// Đăng nhập bằng email
await signIn({ username: email, password });
```

`signInWithRedirect` mở Cognito Hosted UI (trên web) hoặc in-app browser (trên native qua `expo-web-browser`), Cognito redirect sang Google, Google redirect về Cognito, rồi Cognito cuối cùng redirect về một trong các `callbackUrls` khai báo trong `auth/resource.ts`.

## Pattern auth guard

`frontend/app/_layout.tsx` chạy một auth guard subscribe `Hub.listen('auth')` và trạng thái user hiện tại. User chưa đăng nhập sẽ bị đẩy về `/welcome`:

```tsx
import { useEffect } from 'react';
import { router } from 'expo-router';
import { getCurrentUser } from 'aws-amplify/auth';

useEffect(() => {
  getCurrentUser()
    .then(() => { /* đã đăng nhập — ở lại */ })
    .catch(() => router.replace('/welcome'));
}, []);
```

Guard chạy mỗi lần mount root layout, nên khi session rơi (vd refresh token bị revoke) user sẽ bị đẩy từ tabs về `/welcome` ở lần navigation kế tiếp.

## Luồng sign-up và mã lỗi

Luồng đăng ký bằng email gồm ba màn: `signup` → `verify-otp` → `(tabs)/home`. Frontend phải xử lý ba lỗi Cognito rõ ràng:

| Exception | Khi nào | Hành vi frontend |
| --- | --- | --- |
| `UserNotFoundException` | Đăng nhập mà email chưa từng sign-up | Điều hướng tới `/signup` kèm email pre-fill |
| `UserNotConfirmedException` | Đăng nhập mà user tồn tại nhưng chưa nhập OTP | Gọi `resendSignUpCode`, rồi điều hướng `/verify-otp` |
| `NotAuthorizedException` | Đăng nhập mà mật khẩu sai | Hiện lỗi inline trên field mật khẩu |

Cả ba đều ném từ `aws-amplify/auth` với thuộc tính `name` bằng đúng tên exception trên.

![Email OTP do Cognito gửi](images/otp-email.png)

## Test end to end

Với sandbox đang chạy và Expo web dev server đã bật (`cd ../frontend && npm run web`):

1. Mở `http://localhost:8081/`.
2. Bấm **Sign up**, nhập một email thật mà bạn check được, chọn password hợp chính sách Cognito mặc định (8+ ký tự, 1 hoa, 1 thường, 1 số, 1 ký tự đặc biệt).
3. Kiểm hộp thư cho mã sáu chữ số (chủ đề: "Your verification code").
4. Nhập mã ở màn `verify-otp`.
5. Bạn phải vào được `(tabs)/home`.

Rồi test luồng Google:

1. Sign out (`signOut()` từ `aws-amplify/auth`).
2. Ở `/welcome`, bấm **Continue with Google**.
3. Hoàn tất màn consent của Google.
4. Bạn phải được redirect về `http://localhost:8081/` và vào `(tabs)/home`.

Nếu một trong hai luồng fail, mở devtools trình duyệt tab network xem call `/oauth2/idpresponse` hoặc `/oauth2/token` và đọc error body. Phần lớn lỗi ở đây là thiếu redirect URI trong Google, hoặc sai domain Cognito bên phía Google.

Tiếp tục sang [4.3.3 S3 Storage](../4.3.3-S3-Storage/).
