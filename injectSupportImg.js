const fs = require('fs');

const updateFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');

  const startStr = '                    </div>\n                  )}';
  const endStr = '\n                </div>\n              </div>\n              <div className="modal-footer">';
  
  const startIdx = content.indexOf('                  {selectedCargo.viTriHienTai && (');
  if (startIdx === -1) {
    console.log('Target not found in', filePath);
    return;
  }
  const endIdx = content.indexOf(endStr, startIdx);
  if (endIdx === -1) {
    console.log('End bound not found in', filePath);
    return;
  }

  const replaceStr = `                  {selectedCargo.viTriHienTai && (
                    <div className="col-12">
                      <label className="text-xs text-slate-400 fw-bold uppercase">Vị trí hiện tại</label>
                      <div className="p-2 bg-success bg-opacity-10 rounded text-success fw-bold">📍 {selectedCargo.viTriHienTai}</div>
                    </div>
                  )}
                  {(() => {
                    const imgs = selectedCargo.hinhAnh || [];
                    if (imgs.length === 0) return null;

                    let customerImages = imgs;
                    let pickupImage = null;
                    let deliveryImage = null;
                    const dbStatus = selectedCargo.trangThaiKyGui;

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
                        <div className="mt-3">
                          <label className="text-xs text-slate-400 fw-bold uppercase"><i className="bi bi-camera"></i> {title}</label>
                          <div className="d-flex flex-wrap gap-2 mt-2">
                            {imagesArray.map((img, i) => (
                              <img key={i} src={img} alt={\`\${title} \${i+1}\`} style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #dee2e6' }} />
                            ))}
                          </div>
                        </div>
                      );
                    };

                    return (
                      <div className="col-12 border-top pt-3 mt-3">
                        {renderImageGroup("Hình ảnh khách gửi", customerImages)}
                        {renderImageGroup("Ảnh nhận hàng", pickupImage ? [pickupImage] : [])}
                        {renderImageGroup("Ảnh giao hàng", deliveryImage ? [deliveryImage] : [])}
                      </div>
                    );
                  })()}`;

  content = content.substring(0, startIdx) + replaceStr + content.substring(endIdx);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed', filePath);
};

updateFile('BusGo-Frontend/src/admin/pages/SupportCargoPage.jsx');
