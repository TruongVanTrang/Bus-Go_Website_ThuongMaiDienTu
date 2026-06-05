const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', 'utf8');

const startStr = '                {/* Hình ảnh (nếu có) */}';
const startIdx = content.indexOf(startStr);
const searchIconIdx = content.indexOf('Search className="h-6 w-6 text-white"', startIdx);
const actualEndIdx = content.indexOf(')}', searchIconIdx) + 2;

const blockToReplace = content.substring(startIdx, actualEndIdx);

const replaceStr = `{/* Hình ảnh (nếu có) */}
                {(() => {
                  const imgs = selectedCargoForDetail.images || [];
                  if (imgs.length === 0) return null;

                  let customerImages = imgs;
                  let pickupImage = null;
                  let deliveryImage = null;
                  const dbStatus = selectedCargoForDetail.status;

                  if (dbStatus === 'delivered' && imgs.length >= 2) {
                    deliveryImage = imgs[imgs.length - 1];
                    pickupImage = imgs[imgs.length - 2];
                    customerImages = imgs.slice(0, imgs.length - 2);
                  } else if (dbStatus === 'delivered' && imgs.length === 1) {
                    deliveryImage = imgs[0];
                    customerImages = [];
                  } else if (['in_transit', 'received_at_station'].includes(dbStatus) && imgs.length >= 1) {
                    pickupImage = imgs[imgs.length - 1];
                    customerImages = imgs.slice(0, imgs.length - 1);
                  }

                  const renderImageGroup = (title, imagesArray) => {
                    if (!imagesArray || imagesArray.length === 0) return null;
                    return (
                      <div className="space-y-3 pb-2 mt-4">
                        <h3 className="text-xs font-black text-[#004b87] uppercase tracking-wider flex items-center gap-2">
                          <Camera className="h-4 w-4" /> {title}
                        </h3>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                          {imagesArray.map((img, i) => (
                            <div key={i} className="flex-shrink-0 w-32 h-32 rounded-xl overflow-hidden border border-slate-200 shadow-sm relative group cursor-pointer">
                              <img src={img} alt={\`\${title} \${i+1}\`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Search className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  };

                  return (
                    <div className="pt-2 border-t border-slate-100">
                      {renderImageGroup("Hình ảnh khách gửi", customerImages)}
                      {renderImageGroup("Ảnh nhận hàng", pickupImage ? [pickupImage] : [])}
                      {renderImageGroup("Ảnh giao hàng", deliveryImage ? [deliveryImage] : [])}
                    </div>
                  );
                })()}`;

content = content.substring(0, startIdx) + replaceStr + content.substring(actualEndIdx);
fs.writeFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', content, 'utf8');
console.log('Fixed driver');
