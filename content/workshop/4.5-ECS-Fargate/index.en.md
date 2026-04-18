The ECS Fargate layer runs a containerized FastAPI service in parallel with the Amplify serverless backend. It handles tasks not suitable for Lambda, such as long-running data processing, custom AI inference, or processes requiring persistent connections.

## System Architecture

![NutriTrack API VPC Architecture](images/only-nutritrack-api-vpc.drawio.svg)

The ECS tasks run in a **Private Subnet** for security, while an **Application Load Balancer (ALB)** resides in the **Public Subnet** to receive internet requests. Tasks access other AWS services through a **NAT Instance** (saving 70% cost compared to a NAT Gateway) or an **S3 Gateway Endpoint** (free).

## Implementation Steps:

1. [4.5.1 VPC & Network Infrastructure](4.5.1-VPC-Network/)
2. [4.5.2 Supporting Infrastructure (S3, Secrets, IAM)](4.5.2-Infrastructure/)
3. [4.5.3 NAT Optimization (NAT Instance)](4.5.3-NAT-Instance/)
4. [4.5.4 Fargate & ALB Deployment](4.5.4-Fargate-ALB/)

---

[Continue to 4.6 CI/CD Deployment](../4.6-CICD/)
