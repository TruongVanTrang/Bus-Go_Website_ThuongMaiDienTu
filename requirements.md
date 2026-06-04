
# Requirements Document

## Introduction

Tính năng Support Staff cung cấp cho nhân viên hỗ trợ khách hàng (Support Agents) các công cụ để giao tiếp trực tiếp với khách hàng và xử lý các yêu cầu hoàn hủy vé. Tính năng này gồm hai chức năng chính:

1. **Chat thực tế (Live Chat)**: Cho phép nhân viên hỗ trợ giao tiếp trực tiếp với khách hàng thông qua tin nhắn, hướng dẫn, giải đáp thắc mắc.
2. **Xử lý hủy/hoàn vé (Ticket Cancellation/Refund)**: Cho phép nhân viên hỗ trợ xử lý các yêu cầu hoàn hủy vé và xử lý hoàn tiền hợp lý.

## Glossary

- **Support_Agent**: Nhân viên hỗ trợ khách hàng của hệ thống BusGo, có quyền truy cập vào các công cụ quản lý chat và xử lý hoàn hủy vé.
- **Customer**: Khách hàng của hệ thống BusGo, có thể gửi tin nhắn tới Support_Agent thông qua Live Chat.
- **Live_Chat**: Kênh giao tiếp thời gian thực giữa Support_Agent và Customer để trao đổi thông tin, hỗ trợ, giải đáp thắc mắc.
- **Chat_Message**: Một tin nhắn trong kênh Live_Chat được gửi bởi Support_Agent hoặc Customer.
- **Ticket**: Vé xe bus được phát hành trong hệ thống BusGo, bao gồm thông tin hành khách, chuyến xe, ghế ngồi, và trạng thái.
- **Refund_Policy**: Chính sách hoàn tiền được áp dụng cho các yêu cầu hủy vé, bao gồm các điều kiện về thời gian, trạng thái thanh toán.
- **Cancellation_Request**: Yêu cầu hủy vé từ Customer, được xử lý bởi Support_Agent.
- **Refund_Status**: Trạng thái của quá trình hoàn tiền (pending, approved, rejected, completed).
- **Ticket_Status**: Trạng thái của vé (da_dat, da_thanh_toan, da_huy, etc.).
- **Payment_Status**: Trạng thái thanh toán của vé (da_thanh_toan, chua_thanh_toan, da_hoan_tien).
- **Cancellation_Reason**: Lý do khách hàng muốn hủy vé (personal, health, schedule_conflict, etc.).
- **Refund_Amount**: Số tiền được hoàn lại cho khách hàng sau khi hủy vé.
- **Cancellation_Deadline**: Thời hạn cuối cùng cho phép hủy vé trước thời gian khởi hành.

## Requirements

### Requirement 1: Khởi Tạo Chat Thực Tế (Initialize Live Chat)

**User Story:** Là một Support Agent, tôi muốn có thể khởi tạo một kênh chat thực tế với khách hàng, để tôi có thể giao tiếp trực tiếp và hỗ trợ họ.

#### Tiêu Chí Chấp Nhận

1. WHEN a Support_Agent opens the Live_Chat interface, THE System SHALL display a list of active Customers waiting for support.
2. WHEN a Support_Agent selects a Customer from the list, THE System SHALL create a new Chat_Session for that Customer if one does not exist.
3. WHEN a new Chat_Session is created, THE System SHALL record the Chat_Session with Support_Agent_ID, Customer_ID, and creation_timestamp.
4. WHEN a Chat_Session is active, THE System SHALL maintain a continuous connection to allow real-time message exchange.
5. WHEN a Support_Agent views an active Chat_Session, THE System SHALL display the complete conversation history with all Chat_Messages in chronological order.
6. WHEN a Chat_Message is sent, THE System SHALL assign it a unique message_id and record the sender (Support_Agent or Customer), timestamp, and message_content.

### Requirement 2: Gửi Và Nhận Tin Nhắn Chat (Send And Receive Chat Messages)

**User Story:** Là một Support Agent, tôi muốn gửi tin nhắn hướng dẫn và nhận tin nhắn từ khách hàng, để có thể trả lời thắc mắc của họ ngay lập tức.

#### Tiêu Chí Chấp Nhận

1. WHEN a Support_Agent types a message and clicks send, THE System SHALL validate that message_content is not empty (not null and not whitespace only).
2. WHEN a message validation succeeds, THE System SHALL store the Chat_Message in the database with all required fields (sender_id, chat_session_id, message_content, timestamp, message_status).
3. WHEN a Chat_Message is stored successfully, THE System SHALL emit a real-time notification to the Customer's client so the message appears immediately.
4. WHEN a Customer sends a message, THE System SHALL store it similarly and notify the Support_Agent in real-time.
5. WHEN a Chat_Message fails to send due to connection error, THE System SHALL display an error message to the sender and provide an option to retry.
6. WHEN a Support_Agent sends a message containing special characters or unicode, THE System SHALL correctly encode and display it in the Customer's client.

### Requirement 3: Quản Lý Trạng Thái Chat (Manage Chat Status)

**User Story:** Là một Support Agent, tôi muốn quản lý trạng thái chat (active, closed, awaiting response), để theo dõi các phiên hỗ trợ hiệu quả hơn.

#### Tiêu Chí Chấp Nhận

1. WHEN a Support_Agent ends a Chat_Session, THE System SHALL update the Chat_Session status to 'closed' and record the closing_timestamp.
2. WHEN a Chat_Session is closed, THE System SHALL prevent further messages from being sent in that session.
3. WHEN a Chat_Session reaches 15 minutes of inactivity, THE System SHALL change the status to 'inactive' and notify the Support_Agent.
4. WHEN a Customer sends a new message in an 'inactive' Chat_Session, THE System SHALL automatically change the status back to 'active'.
5. WHERE a Support_Agent is unavailable, THE System SHALL display a queue status showing the position of the Customer's chat request (e.g., "Position 3 in queue").
6. WHEN a Chat_Session is in 'awaiting response' state and the Support_Agent takes more than 2 minutes to respond, THE System SHALL flag the chat as potentially needing escalation.

### Requirement 4: Trích Xuất Thông Tin Vé Trong Chat (Extract Ticket Information In Chat)

**User Story:** Là một Support Agent, tôi muốn xem thông tin vé của khách hàng trực tiếp trong giao diện chat, để nhanh chóng giải quyết các vấn đề liên quan đến vé của họ.

#### Tiêu Chí Chấp Nhận

1. WHEN a Support_Agent is viewing a Chat_Session with a Customer, THE System SHALL display a summary panel showing all active and inactive Tickets associated with that Customer.
2. WHEN a Support_Agent clicks on a specific Ticket in the summary panel, THE System SHALL display detailed information including ticket_id, passenger_name, route, departure_time, seat_number, booking_date, and ticket_status.
3. WHEN a Support_Agent searches for a Ticket using ticket_id or booking_id, THE System SHALL retrieve the Ticket details and display them in real-time.
4. WHEN Ticket_Status or Payment_Status changes (e.g., ticket is cancelled externally), THE System SHALL automatically refresh the ticket information in the Support_Agent's view.

### Requirement 5: Xử Lý Yêu Cầu Hủy Vé - Kiểm Tra Điều Kiện (Handle Cancellation Request - Verify Conditions)

**User Story:** Là một Support Agent, tôi muốn kiểm tra các điều kiện hủy vé trước khi phê duyệt, để đảm bảo tuân thủ chính sách hoàn hủy vé của công ty.

#### Tiêu Chí Chấp Nhận

1. WHEN a Support_Agent reviews a Cancellation_Request, THE System SHALL display all relevant Ticket information and verify the current Ticket_Status.
2. WHEN a Support_Agent checks the cancellation eligibility, THE System SHALL verify the Cancellation_Deadline (typically 24 hours before departure) and display a clear message indicating whether cancellation is allowed.
3. IF the current_time is after the Cancellation_Deadline, THEN THE System SHALL display a message stating "Cancellation is not allowed as the departure time is within 24 hours" and prevent further processing.
4. WHEN a Support_Agent checks Payment_Status, THE System SHALL display whether the Ticket has been paid (da_thanh_toan) or not (chua_thanh_toan) to determine refund eligibility.
5. IF Payment_Status is 'chua_thanh_toan', THEN THE System SHALL prevent the Support_Agent from processing a refund and display an alternative action (e.g., "Cancel booking without refund").
6. WHEN verifying the trip status, THE System SHALL check if the trip has already started or completed, and display the trip_status (e.g., "Trip has started, cancellation is not allowed").

### Requirement 6: Xử Lý Yêu Cầu Hủy Vé - Tính Toán Hoàn Tiền (Handle Cancellation Request - Calculate Refund Amount)

**User Story:** Là một Support Agent, tôi muốn hệ thống tự động tính toán số tiền hoàn lại theo chính sách hoàn hủy vé, để xử lý yêu cầu hoàn tiền một cách chính xác.

#### Tiêu Chí Chấp Nhận

1. WHEN a Support_Agent approves a Cancellation_Request and the Cancellation_Deadline has not passed, THE System SHALL calculate the Refund_Amount based on the Refund_Policy.
2. WHERE a Ticket is cancelled more than 24 hours before departure, THE System SHALL apply a 100% refund (full refund minus 5% administrative fee).
3. WHERE a Ticket is cancelled 12-24 hours before departure, THE System SHALL apply a 75% refund (full refund minus 25% penalty minus 5% administrative fee).
4. WHERE a Ticket is cancelled 0-12 hours before departure, THE System SHALL apply a 50% refund (full refund minus 50% penalty minus 5% administrative fee).
5. WHERE a Ticket cannot be cancelled due to business rules, THE System SHALL set Refund_Amount to 0 and display the reason to the Support_Agent.
6. WHEN the Refund_Amount is calculated, THE System SHALL display the calculation breakdown to the Support_Agent showing: ticket_price, penalty_percentage, administrative_fee, and final_refund_amount.

### Requirement 7: Phê Duyệt/Từ Chối Yêu Cầu Hủy Vé (Approve/Reject Cancellation Request)

**User Story:** Là một Support Agent, tôi muốn phê duyệt hoặc từ chối yêu cầu hủy vé với ghi chú lý do, để duy trì quá trình xử lý minh bạch.

#### Tiêu Chí Chấp Nhận

1. WHEN a Support_Agent reviews a Cancellation_Request with all conditions met, THE System SHALL provide an "Approve" button and a "Reject" button.
2. WHEN a Support_Agent clicks the "Approve" button, THE System SHALL update the Cancellation_Request status to 'approved' and Refund_Status to 'approved'.
3. WHEN a Support_Agent clicks the "Reject" button, THE System SHALL require the Support_Agent to enter a rejection_reason before submission.
4. WHEN a rejection_reason is provided and submitted, THE System SHALL update the Cancellation_Request status to 'rejected' and Refund_Status to 'rejected' with the rejection_reason recorded.
5. WHEN a Cancellation_Request is approved, THE System SHALL update the Ticket_Status to 'da_huy' and record the cancellation_timestamp and approver_id (Support_Agent_ID).
6. WHEN a Cancellation_Request is rejected, THE System SHALL notify the Customer with the rejection_reason via email or in-app notification.

### Requirement 8: Xử Lý Hoàn Tiền (Process Refund)

**User Story:** Là một Support Agent, tôi muốn hệ thống tự động xử lý hoàn tiền đã được phê duyệt, để khách hàng nhận được tiền hoàn lại một cách nhanh chóng.

#### Tiêu Chí Chấp Nhận

1. WHEN a Cancellation_Request is approved, THE System SHALL initiate the refund process by queuing the refund transaction.
2. WHEN the refund transaction is queued, THE System SHALL update the Refund_Status to 'processing' and display a "Processing refund..." message to the Support_Agent.
3. WHEN the refund is processed successfully, THE System SHALL update the Refund_Status to 'completed' and record the refund_completion_timestamp.
4. WHEN the refund is successful, THE System SHALL update the Ticket_Status to 'da_huy' and the Payment_Status to 'da_hoan_tien'.
5. WHEN the refund fails (e.g., due to payment gateway error), THE System SHALL update the Refund_Status to 'failed' and log the error message for review.
6. WHEN a refund is completed successfully, THE System SHALL send a confirmation email to the Customer with the refund_amount and expected_delivery_timeframe (e.g., "Refund will be processed within 3-5 business days").

### Requirement 9: Xử Lý Lỗi Hoàn Tiền (Handle Refund Errors)

**User Story:** Là một Support Agent, tôi muốn có thể thử lại quá trình hoàn tiền nếu xảy ra lỗi, để đảm bảo khách hàng cuối cùng nhận được tiền hoàn lại.

#### Tiêu Chí Chấp Nhận

1. WHEN a refund fails, THE System SHALL display a detailed error message to the Support_Agent explaining the reason (e.g., "Payment gateway timeout", "Invalid bank account").
2. WHEN a Support_Agent views a failed refund, THE System SHALL provide a "Retry refund" button to attempt the refund process again.
3. WHEN a Support_Agent clicks "Retry refund", THE System SHALL re-submit the refund transaction to the payment gateway and update Refund_Status back to 'processing'.
4. IF the refund fails 3 consecutive times, THEN THE System SHALL mark the Cancellation_Request as 'manual_review_required' and notify the system administrator.
5. WHEN a Cancellation_Request is marked for manual review, THE System SHALL display it in a special queue for administrative staff to investigate and resolve.

### Requirement 10: Lịch Sử Và Audit Log (History And Audit Log)

**User Story:** Là một quản trị viên hệ thống, tôi muốn xem lịch sử các hành động của Support Agent (phê duyệt, từ chối, xử lý hoàn tiền), để có thể kiểm toán và giám sát các giao dịch.

#### Tiêu Chí Chấp Nhận

1. WHEN a Cancellation_Request is created, updated, or completed, THE System SHALL create an audit_log entry recording the action, actor (Support_Agent_ID), timestamp, and relevant details.
2. WHEN a Support_Agent approves or rejects a Cancellation_Request, THE System SHALL record the action with the Support_Agent_ID and decision_timestamp in the audit_log.
3. WHEN a refund is processed, THE System SHALL record the refund_amount, refund_status_change, and transaction_id in the audit_log.
4. WHERE a system administrator accesses the audit log, THE System SHALL display all Cancellation_Requests with their complete history including status changes, approver information, and timestamps.
5. WHEN a Support_Agent queries the cancellation history for a specific Customer, THE System SHALL retrieve and display all past Cancellation_Requests with their final status and refund_amounts.

### Yêu Cầu 11: Thông Báo Cho Khách Hàng

**User Story:** Là một khách hàng, tôi muốn được thông báo về trạng thái yêu cầu hủy vé và hoàn tiền của mình, để có thể theo dõi quá trình xử lý.

#### Tiêu Chí Chấp Nhận

1. WHEN a Cancellation_Request status changes to 'approved', THE System SHALL send a notification to the Customer (via email and in-app) with the message "Your cancellation request has been approved. Refund amount: [amount]".
2. WHEN a Cancellation_Request status changes to 'rejected', THE System SHALL send a notification to the Customer with the message "Your cancellation request has been rejected. Reason: [rejection_reason]".
3. WHEN a Refund_Status changes to 'completed', THE System SHALL send a confirmation email to the Customer with the refund_amount and expected_delivery_timeframe.
4. WHEN a Cancellation_Request is initially submitted, THE System SHALL send an acknowledgment notification to the Customer stating "Your cancellation request has been received. We will review it shortly."
5. WHEN a Refund_Status remains 'processing' for more than 6 hours, THE System SHALL send a reminder notification to the Support_Agent to check the status.

### Yêu Cầu 12: Dashboard Quản Lý Support

**User Story:** Là một quản lý Support Staff, tôi muốn xem dashboard với số liệu về các yêu cầu hủy vé, hoàn tiền, và hiệu suất của nhân viên, để có thể quản lý hiệu quả.

#### Tiêu Chí Chấp Nhận

1. WHEN a Support_Manager accesses the support dashboard, THE System SHALL display the following metrics: total_cancellation_requests_today, approved_count, rejected_count, pending_count, total_refund_amount_processed.
2. WHEN a Support_Manager views the chat statistics, THE System SHALL display: total_active_chats, average_resolution_time, average_chat_duration, and customer_satisfaction_rating.
3. WHEN a Support_Manager filters by date range, THE System SHALL update all dashboard metrics to reflect the selected period.
4. WHEN a Support_Manager clicks on a specific metric, THE System SHALL display a detailed breakdown or list of related items for further investigation.
5. WHEN a Support_Manager reviews performance metrics, THE System SHALL display per-agent statistics including: number_of_chats_handled, number_of_cancellations_processed, and average_approval_rate.

---

## Ràng Buộc và Điều Kiện Kinh Doanh

### Ràng Buộc Chính Sách Hoàn Hủy Vé

1. Khách hàng chỉ có thể hủy vé trước khi chuyến xe khởi hành tối thiểu 24 giờ.
2. Chính sách hoàn tiền:
   - **Trước 24 giờ**: Hoàn 100% - 5% phí hành chính = 95% giá vé
   - **12-24 giờ**: Hoàn 75% - 5% phí hành chính = 70% giá vé
   - **0-12 giờ**: Hoàn 50% - 5% phí hành chính = 45% giá vé
   - **Sau khi chuyến xe khởi hành**: Không hủy được

3. Chỉ có thể hoàn tiền nếu vé đã được thanh toán (trạng thái = 'da_thanh_toan').
4. Vé không thể hủy nếu chuyến xe đã khởi hành hoặc hoàn thành.

### Ràng Buộc An Ninh

1. Chỉ nhân viên hỗ trợ được xác thực mới có quyền truy cập giao diện Support.
2. Mỗi hành động của Support_Agent (phê duyệt, từ chối) phải được ghi nhận đầy đủ trong audit log.
3. Hoàn tiền chỉ được xử lý thông qua payment gateway được xác thực (VNPay, Momo, etc.).

### Ràng Buộc Hiệu Suất

1. Thời gian phản hồi trung bình cho chat không quá 2 phút.
2. Thời gian xử lý hoàn tiền không quá 6 giờ (trạng thái vẫn có thể là 'processing', nhưng phải được hoàn thành trong vòng 3-5 ngày làm việc).
3. Chat session khi không có hoạt động trong 15 phút sẽ tự động đánh dấu là 'inactive'.

### Ràng Buộc Dữ Liệu

1. Tất cả tin nhắn chat phải được mã hóa và lưu trữ an toàn.
2. Lịch sử chat phải được lưu vô thời hạn để phục vụ việc kiểm toán.
3. Thông tin hoàn tiền phải tuân thủ các quy định bảo mật thanh toán (PCI-DSS).

---

## Trường Hợp Sử Dụng

### Trường Hợp 1: Support Agent Xử Lý Yêu Cầu Hoàn Hủy Vé Tiêu Chuẩn

1. Khách hàng gửi tin nhắn qua Live Chat: "Tôi muốn hủy vé của mình, chuyến khởi hành ngày mai."
2. Support Agent nhận được tin nhắn và yêu cầu ticket ID.
3. Khách hàng cung cấp ticket ID.
4. Support Agent tra cứu vé và kiểm tra:
   - Thời gian hiện tại: 20 giờ trước khi khởi hành (> 24 giờ? No, chỉ 20 giờ)
   - Tuy nhiên, ví dụ này là chuyến khởi hành "ngày mai", giả sử là sau 24 giờ.
   - Trạng thái thanh toán: da_thanh_toan
5. Support Agent tính toán hoàn tiền (ví dụ: 100% hoàn tiền)
6. Support Agent nhấn "Phê duyệt" và gửi tin nhắn cho khách hàng: "Yêu cầu hủy vé của bạn đã được phê duyệt. Bạn sẽ nhận được [amount] trong vòng 3-5 ngày làm việc."
7. Hệ thống xử lý hoàn tiền tự động.
8. Khách hàng nhận được email xác nhận hoàn tiền.

### Trường Hợp 2: Support Agent Từ Chối Yêu Cầu Hủy Vé Vì Vượt Thời Hạn

1. Khách hàng gửi yêu cầu hủy vé: "Tôi chỉ còn 6 giờ để khởi hành, tôi muốn hủy vé."
2. Support Agent tra cứu vé và nhận thấy chỉ còn 6 giờ.
3. Support Agent kiểm tra chính sách: Hủy vé trong 0-12 giờ được phép (áp dụng 50% hoàn tiền).
4. Support Agent phê duyệt với hoàn tiền 50%.
5. Hệ thống xử lý hoàn tiền.
6. Khách hàng nhận được thông báo phê duyệt với số tiền hoàn lại.

### Trường Hợp 3: Khách Hàng Cần Hỗ Trợ Kỹ Thuật

1. Khách hàng mở Live Chat: "Tôi không thể tải vé của mình từ app."
2. Support Agent đáp ứng: "Xin lỗi vì sự cố này. Tôi sẽ giúp bạn. Vui lòng cung cấp ticket ID hoặc email đặt vé."
3. Khách hàng cung cấp email.
4. Support Agent tra cứu vé và gửi lại vé cho khách hàng bằng email.
5. Support Agent xác nhận: "Vé của bạn đã được gửi lại. Kiểm tra email của bạn."

### Trường Hợp 4: Support Agent Xử Lý Hoàn Tiền Thất Bại

1. Support Agent phê duyệt hoàn tiền.
2. Hệ thống cố gắng xử lý hoàn tiền nhưng thất bại (lỗi gateway).
3. Support Agent nhận thấy trạng thái 'failed' và nhấn "Thử lại".
4. Hệ thống xử lý lại hoàn tiền và thành công.
5. Khách hàng nhận được email xác nhận hoàn tiền.

### Trường Hợp 5: Quản Lý Kiểm Tra Dashboard

1. Quản lý truy cập dashboard Support.
2. Quản lý xem: 45 yêu cầu hủy vé hôm nay, 35 được phê duyệt, 8 bị từ chối, 2 đang chờ xử lý.
3. Quản lý nhấn vào "8 bị từ chối" để xem chi tiết.
4. Quản lý xem danh sách các yêu cầu bị từ chối và lý do từ chối.
5. Quản lý kiểm tra thống kê per-agent: Agent A xử lý 15 vé, Agent B xử lý 20 vé.

---

## Điều Kiện Chấp Nhận Chi Tiết (Expanded Acceptance Criteria)

### Điều Kiện Chung

- Tất cả thông báo phải là rõ ràng, ngắn gọn, và theo tiêu chuẩn của hệ thống.
- Giao diện phải tương thích với các trình duyệt hiện đại (Chrome, Firefox, Safari, Edge).
- Tất cả dữ liệu nhạy cảm phải được mã hóa trong quá trình truyền tải.

### Điều Kiện Kiểm Thử

1. Kiểm thử hoàn tiền trong các khoảng thời gian khác nhau:
   - Trước 24 giờ: Nên nhận 95% (100% - 5%)
   - 12-24 giờ: Nên nhận 70% (75% - 5%)
   - 0-12 giờ: Nên nhận 45% (50% - 5%)

2. Kiểm thử chat với các trường hợp:
   - Tin nhắn dài (> 1000 ký tự)
   - Tin nhắn chứa emoji
   - Tin nhắn chứa URL
   - Kết nối mất kết nối/mất mạng

3. Kiểm thử audit log:
   - Tất cả hành động phải được ghi nhận
   - Thông tin chi tiết phải chính xác (ID người dùng, thời gian, hành động)

