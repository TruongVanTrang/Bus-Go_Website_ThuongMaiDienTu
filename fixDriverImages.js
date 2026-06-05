const fs = require('fs');

function fixImages(file) {
  let content = fs.readFileSync(file, 'utf8');

  const targetLogic = `                  const imgs = selectedCargo.images || [];
                  let customerImages = Array.isArray(imgs) ? imgs.slice(0, Math.max(0, imgs.length - 2)) : [];
                  let pickupImage = imgs.length >= 1 ? imgs[imgs.length - 2] : null;
                  let deliveryImage = imgs.length >= 2 ? imgs[imgs.length - 1] : null;`;

  const replacementLogic = `                  const imgs = selectedCargo.images || [];
                  let customerImages = imgs;
                  let pickupImage = null;
                  let deliveryImage = null;

                  if (['DELIVERED', 'COMPLETED', 'da_hoan_thanh'].includes(selectedCargo.status) && imgs.length >= 2) {
                    deliveryImage = imgs[imgs.length - 1];
                    pickupImage = imgs[imgs.length - 2];
                    customerImages = imgs.slice(0, imgs.length - 2);
                  } else if (['DELIVERED', 'COMPLETED', 'da_hoan_thanh'].includes(selectedCargo.status) && imgs.length === 1) {
                    deliveryImage = imgs[0];
                    customerImages = [];
                  } else if (['IN_TRANSIT', 'dang_khoi_hanh'].includes(selectedCargo.status) && imgs.length >= 1) {
                    pickupImage = imgs[imgs.length - 1];
                    customerImages = imgs.slice(0, imgs.length - 1);
                  }`;

  content = content.replace(targetLogic, replacementLogic);
  fs.writeFileSync(file, content, 'utf8');
}

fixImages('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx');
console.log('Fixed DriverDashboard images logic');
