# AWS Cloud Mastery 3 - Networking and Security

**Date:** April 11, 2026
**Location:** Hall A - FPT University HCMC, Ho Chi Minh City
**Role:** Attendee (FCJ Cloud Intern - Team NeuraX)

## Event Description

The final meetup in the Cloud Mastery series, focused on AWS networking and security. The session aimed to help interns and developers build secure access control, optimize network costs, and protect applications from external attacks.

## Main Activities

Three technical sessions covered networking, identity, and firewalls:
**Session 1: VPC Networking - NAT Gateway, Security Group & NACL** - Explained NAT Gateway ephemeral ports (1024-65535), zonal vs regional NAT, and compared stateful Security Groups with stateless Network ACLs.
**Session 2: IAM Deep Dive, SSO & SCP** - Reinforced least privilege, avoiding wildcard usage, MFA, and clarified IAM Identity Center, Permission Boundaries, and SCPs across AWS Organizations.
**Session 3: Application Security & AWS Firewalls** - Introduced AWS WAF, Shield, Network Firewall, and Firewall Manager to mitigate application layer DDoS and abuse.

## Outcomes

- **Multi-layer firewall setup:** Clearer understanding of combining Security Groups and Network ACLs for layered protection.
- **Secure credentials management:** Shifted away from long term keys toward STS/SSO short term sessions to reduce leak risk.
- **Avoiding critical security leaks:** Recognized the danger of committing `.env` files and the potential for abuse or ransomware.
- **Protecting scale costs:** Learned why Auto Scaling must be protected by WAF/Shield to avoid cost spikes.
