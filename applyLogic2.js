const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', 'utf8');

// Replace APPROVED block
const approvedRegex = /\{item\.status === 'APPROVED' && item\.isConsignment && \([\s\S]*?Chờ KH thanh toán<\/span>\r?\n\s*\)\r?\n\s*\)\}/;
const approvedReplacement = `{item.status === 'APPROVED' && item.isConsignment && (
                                            item.paymentStatus === 'paid' ? (
                                              (currentUser.role === 'TRUCK_DRIVER' || (onShift && isTripStarted)) ? (
                                                <div className="flex flex-col items-end gap-1 w-full">
                                                  <span className="text-[10px] text-amber-600 font-bold block w-full text-right">Chờ đến nhận</span>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleCargoStatusUpdate(item.id, 'APPROVED', item.dbId, item.isConsignment)}
                                                    className="border-amber-200 text-amber-700 hover:bg-amber-50 h-8 text-xs px-2.5 rounded-lg"
                                                  >
                                                    <Check className="h-3.5 w-3.5 mr-1" />
                                                    Đã nhận hàng
                                                  </Button>
                                                </div>
                                              ) : (
                                                <span className="text-[10px] text-slate-500 font-bold block w-full text-right">{currentUser.role === 'TRUCK_DRIVER' ? 'Đã thanh toán (Sẵn sàng nhận hàng)' : 'Đã thanh toán (Chờ xuất phát)'}</span>
                                              )
                                            ) : (
                                              <span className="text-[10px] text-slate-500 font-bold italic mt-1 text-right block w-full">Chờ KH thanh toán</span>
                                            )
                                          )}`;
content = content.replace(approvedRegex, approvedReplacement);

// Replace SHIPPING block
const shippingRegex = /\{item\.status === 'SHIPPING' && \([\s\S]*?Thất bại\r?\n\s*<\/Button>\r?\n\s*<\/>\r?\n\s*\)\}/;
const shippingReplacement = `{item.status === 'SHIPPING' && (
                                            <>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => triggerImageUpload(item.id, 'pickup', item.dbId, item.isConsignment)}
                                                className="border-amber-200 text-amber-700 hover:bg-amber-50 h-8 text-xs px-2.5 rounded-lg mb-1"
                                              >
                                                <Camera className="h-3.5 w-3.5 mr-1" />
                                                Ảnh kiện hàng
                                              </Button>
                                              
                                              {uploadedPickupImages.has(item.id) && (
                                                <Button
                                                  variant="default"
                                                  size="sm"
                                                  onClick={() => handleCargoStatusUpdate(item.id, 'SHIPPING', item.dbId, item.isConsignment)}
                                                  className="bg-[#004b87] hover:bg-[#003d70] h-8 text-xs px-2.5 rounded-lg border-none mb-1 ml-1"
                                                >
                                                  <Truck className="h-3.5 w-3.5 mr-1" />
                                                  Đã giao hàng
                                                </Button>
                                              )}
                                              
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleCargoStatusFail(item.id, item.dbId)}
                                                className="border-red-200 text-red-600 hover:bg-red-50 h-8 text-xs px-2.5 rounded-lg"
                                              >
                                                <X className="h-3.5 w-3.5 mr-1" />
                                                Thất bại
                                              </Button>
                                            </>
                                          )}`;
content = content.replace(shippingRegex, shippingReplacement);

// Replace DELIVERED block
const deliveredRegex = /\{item\.status === 'DELIVERED' && \([\s\S]*?Bàn giao xong\r?\n\s*<\/span>\r?\n\s*\)\}/;
const deliveredReplacement = `{item.status === 'DELIVERED' && (
                                            <div className="flex flex-col items-end gap-1">
                                              {!uploadedDeliveryImages.has(item.id) ? (
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => triggerImageUpload(item.id, 'delivery', item.dbId, item.isConsignment)}
                                                  className="border-blue-200 text-blue-700 hover:bg-blue-50 h-8 text-xs px-2.5 rounded-lg"
                                                >
                                                  <Camera className="h-3.5 w-3.5 mr-1" />
                                                  Ảnh giao hàng
                                                </Button>
                                              ) : (
                                                <span className="text-xs text-green-600 font-black flex items-center justify-end gap-1 py-1">
                                                  <CheckCircle className="h-4 w-4" /> Bàn giao xong
                                                </span>
                                              )}
                                            </div>
                                          )}`;
content = content.replace(deliveredRegex, deliveredReplacement);

fs.writeFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', content, 'utf8');
console.log('Done 3: render logic updated.');
