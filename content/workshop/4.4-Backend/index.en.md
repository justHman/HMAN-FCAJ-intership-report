We will initialize the data heart of NutriTrack using TypeScript source code.

## 1. Initialize Backend Directory

Create a separate directory to manage the infrastructure:

```bash
cd neurax-web-app
mkdir backend
cd backend
```
## 2. Install Dependencies

```bash
npm create amplify@latest --yes
npm install
```

## 3. Sandbox Deployment (First Time)

Use the Amplify CLI (Gen 2) to initialize the project and deploy your personal Sandbox environment:

```bash
npx ampx pipeline-deploy --branch main --app-id [YOUR_APP_ID]

# Or run the following for local work:
npx ampx sandbox
```
![ampx-sandbox-start.png](/images/ampx-sandbox-start.png)

---

## Resource Layer Details:

Now, we will define the core configuration files located within the `amplify/` directory:

1. [Authentication Layer (Auth)](4.4.1-Auth/)
2. [Data Layer (Data)](4.4.2-Data/)
3. [Storage Layer (Storage)](4.4.3-Storage/)
4. [Logic Functions (Functions)](4.4.4-Functions/)

---

[Continue to 4.5 ECS Container Layer](../4.5-ECS-Fargate/)
