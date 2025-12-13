# Cloud Deployment Guide (Vercel + TiDB)

This project relies on a MySQL-compatible database. For serverless deployments like Vercel, we recommend **TiDB Cloud**.

## 1. Database Setup (TiDB)

1.  Create a free account at [TiDB Cloud](https://tidbcloud.com/).
2.  Create a **Standard Cluster** (Serverless).
3.  Click **Connect** to get your credentials:
    *   **Host**: e.g., `gateway01.us-west-2.prod.aws.tidbcloud.com`
    *   **Port**: `4000`
    *   **User**: e.g., `2Ab3...root`
    *   **Password**: *Hidden (Copy it)*

## 2. Vercel Deployment

1.  Push your code to GitHub.
2.  Import the project in Vercel.
3.  Add the following **Environment Variables**:

    ```env
    DB_HOST=your-tidb-host
    DB_PORT=4000
    DB_USER=your-tidb-user
    DB_PASSWORD=your-tidb-password
    DB_NAME=test
    DB_SSL=true
    NEXTAUTH_SECRET=generate-a-random-string
    NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app
    NEXTAUTH_URL=https://your-vercel-app.vercel.app
    ```

    > **Note:** `DB_SSL=true` is REQUIRED for TiDB.

4.  Deploy!

## 3. Post-Deployment Setup

1.  Visit your deployed URL: `https://your-app.vercel.app/setup`
2.  If the setup wizard appears, follow the steps entering the SAME database credentials.
3.  Create your **Super Admin** account.
4.  Once finished, the app is ready to use.
