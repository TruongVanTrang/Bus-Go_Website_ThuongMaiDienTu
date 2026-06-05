const fs = require('fs');

const updateFile = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  const startIndex = content.indexOf('{/* Hình ảnh (nếu có) */}');
  if (startIndex === -1) {
    console.log('Target not found in', filePath);
    return;
  }
  
  const searchEndStr = '</div>\n                  </div>\n                )}';
  const endIndex = content.indexOf(searchEndStr, startIndex);
  if (endIndex === -1) {
    console.log('End bound not found in', filePath);
    return;
  }

  const blockToReplace = content.substring(startIndex, endIndex + searchEndStr.length);

  const replaceStr = `{/* Hình ảnh (nếu có) */}
                {(() => {
                  const imgs = selectedCargoForDetail.images || [];
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
                      <div className="space-y-3 pb-2 mb-4">
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
                    <div className="mt-4 pt-2 border-t border-slate-100">
                      {renderImageGroup("Hình ảnh khách gửi", customerImages)}
                      {renderImageGroup("Ảnh nhận hàng", pickupImage ? [pickupImage] : [])}
                      {renderImageGroup("Ảnh giao hàng", deliveryImage ? [deliveryImage] : [])}
                    </div>
                  );
                })()}`;

  content = content.substring(0, startIndex) + replaceStr + content.substring(endIndex + searchEndStr.length);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed', filePath);
};

updateFile('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx');
updateFile('BusGo-Frontend/src/admin/pages/DriverCargoPage.jsx');
