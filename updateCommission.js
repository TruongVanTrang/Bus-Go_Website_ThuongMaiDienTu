const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', 'utf8');

const startStr = "{/* Chi tiết doanh thu */}";
const endStr = "{/* Hình ảnh (nếu có) */}";

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `{/* Chi tiết doanh thu */}
                    {selectedCargoForDetail.isConsignment ? (
                      <div className="bg-slate-50/50 p-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Chi tiết cước phí & Doanh thu</p>
                        <div className="space-y-2 text-sm font-semibold">
                          <div className="flex justify-between items-center text-slate-600">
                            <span>Tổng cước phí người dùng thanh toán:</span>
                            <span className="font-extrabold">{FormatUtil.formatCurrency(selectedCargoForDetail.totalPrice || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center text-red-500">
                            <span>Phí nền tảng (Chiết khấu 10%):</span>
                            <span>- {FormatUtil.formatCurrency((selectedCargoForDetail.totalPrice || 0) * 0.1)}</span>
                          </div>
                          <div className="h-px bg-slate-200 my-2"></div>
                          <div className="flex justify-between items-center text-[#004b87] text-base">
                            <span className="font-black">Thực nhận của tài xế (90%):</span>
                            <span className="font-black">{FormatUtil.formatCurrency((selectedCargoForDetail.totalPrice || 0) * 0.9)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-50/50 p-4">
                        <div className="flex justify-between items-center text-[#004b87] text-base">
                          <span className="font-black">Tổng cước phí:</span>
                          <span className="font-black">{FormatUtil.formatCurrency(selectedCargoForDetail.totalPrice || 0)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                `;
  content = content.slice(0, startIdx) + replacement + content.slice(endIdx);
  fs.writeFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', content, 'utf8');
  console.log('Commission block replaced successfully.');
} else {
  console.log('Could not find block', startIdx, endIdx);
}
