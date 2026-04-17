## 1. Khởi tạo NAT Instance

Chúng ta sẽ sử dụng instance type `t4g.nano` (kiến trúc ARM Graviton) để tối ưu chi phí và hiệu năng.

1. Vào **EC2 Console** → **Launch Instances**.
2. **AMI**: Chọn **Amazon Linux 2023** (Bản 64-bit Arm).
3. **Instance Type**: `t4g.nano`.
4. **Network Settings**:
   - VPC: `nutritrack-api-vpc`
   - Subnet: `nutritrack-api-vpc-public-alb01` (Public Subnet)
   - Auto-assign Public IP: **Enable**
   - Security Group: `nutritrack-api-vpc-nat-sg`
5. **IAM instance profile**: Chọn `nutritrack-api-vpc-nat-instance-role`.
6. Nhấn **Launch instance**.

> [!IMPORTANT]
> Sau khi instance đã chạy, bạn **bắt buộc** phải tắt tính năng **Source/Destination Check**:
> Chọn Instance → **Actions** → **Networking** → **Change source/destination check** → Chọn **Stop**.

---

## 2. Cấu hình NAT (Script tự động)

Sau khi SSH hoặc dùng SSM để vào NAT Instance, bạn hãy chạy script sau để bật tính năng chuyển tiếp gói tin (IP Forwarding) và cấu hình Masquerade:

```bash
#!/bin/bash
# 1. Bật IP Forwarding
sudo sysctl -w net.ipv4.ip_forward=1

# 2. Cài đặt iptables-services
sudo dnf install iptables-services -y
sudo systemctl enable iptables
sudo systemctl start iptables

# 3. Cấu hình NAT Masquerade (Thay eth0 bằng interface thực tế nếu khác)
sudo iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
sudo iptables-save | sudo tee /etc/sysconfig/iptables
```

---

## 3. Cấu hình High Availability (ASG)

Để đảm bảo hệ thống không bị gián đoạn khi một NAT Instance gặp sự cố, chúng ta nên sử dụng **Auto Scaling Group (ASG)**.

ASG sẽ tự động phát hiện nếu instance bị lỗi và khởi tạo một instance mới thay thế. Bạn có thể sử dụng **User Data** trong Launch Template để tự động chạy các lệnh cấu hình trên và cập nhật Route Table trỏ về Instance ID mới.

> [!TIP]
> Bạn nên tạo mỗi AZ một ASG riêng biệt với `Desired Capacity = 1` để đảm bảo mỗi AZ luôn có đúng một NAT Instance hoạt động.

---

## Các bước tiếp theo:

Hạ tầng mạng và NAT đã sẵn sàng. Bước cuối cùng là triển khai ứng dụng của chúng ta:
- [4.5.4 Triển khai Fargate & ALB](../4.5.4-Fargate-ALB/)
