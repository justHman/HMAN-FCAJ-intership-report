# AWS Cloud Mastery 3 - Networking & Security

**Ngày:** 11 tháng 4, 2026
**Địa điểm:** Hội trường A - Đại học FPT TP.HCM, TP. Hồ Chí Minh
**Vai trò:** Người tham dự (FCJ Cloud Intern - Team NeuraX)

## Mô tả sự kiện

Buổi meetup cuối trong chuỗi Cloud Mastery, tập trung vào networking và security trên AWS. Nội dung hướng đến việc xây dựng phân quyền an toàn, tối ưu chi phí hạ tầng mạng và bảo vệ ứng dụng khỏi tấn công từ bên ngoài.

## Các hoạt động chính

Ba phiên kỹ thuật xoay quanh mạng, IAM và tường lửa:
**Phiên 1: VPC Networking - NAT Gateway, Security Group & NACL** - Phân tích cơ chế cổng tạm thời (1024-65535) của NAT Gateway, so sánh Zonal/Regional NAT và đối chiếu Security Group (stateful) với Network ACL (stateless).
**Phiên 2: IAM Deep Dive, SSO & SCP** - Nhấn mạnh least privilege, tránh wildcard, bật MFA và làm rõ IAM Identity Center, Permission Boundaries và SCP trong AWS Organizations.
**Phiên 3: Application Security & AWS Firewalls** - Giới thiệu AWS WAF, Shield, Network Firewall và Firewall Manager để chống DDoS tầng ứng dụng và kiểm soát luồng mạng.

## Kết quả

- **Thiết lập tường lửa đa lớp:** Hiểu rõ cách kết hợp Security Group và Network ACL để bảo vệ nhiều lớp.
- **Quản lý credentials an toàn:** Ưu tiên STS/SSO với short term session thay vì long term keys.
- **Tránh rò rỉ bảo mật chí mạng:** Nhận thức rủi ro commit `.env` dẫn tới chiếm quyền hoặc ransomware.
- **Bảo vệ chi phí scale:** Auto Scaling cần có WAF/Shield để tránh hóa đơn tăng đột biến do DDoS.
