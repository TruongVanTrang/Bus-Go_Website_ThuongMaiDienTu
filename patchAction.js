const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', 'utf8');

const stateBlock = `  // Cargo Action Dialog State
  const [isCargoActionDialogOpen, setIsCargoActionDialogOpen] = useState(false);
  const [cargoActionData, setCargoActionData] = useState(null);
  const [cargoActionImage, setCargoActionImage] = useState('');
  const [isCargoActionLoading, setIsCargoActionLoading] = useState(false);

  const openCargoActionDialog = (cargoItem, currentStatusForUpdate) => {
    setCargoActionData({ item: cargoItem, currentStatusForUpdate });
    setCargoActionImage('');
    setIsCargoActionDialogOpen(true);
  };

  const handleCargoActionConfirm = async () => {
    if (!cargoActionImage) {
      toast.error('Vui lòng chụp ảnh đính kèm minh chứng!');
      return;
    }
    setIsCargoActionLoading(true);
    try {
      await handleCargoStatusUpdate(
        cargoActionData.item.id,
        cargoActionData.currentStatusForUpdate,
        cargoActionData.item.dbId,
        cargoActionData.item.isConsignment,
        cargoActionImage
      );
      setIsCargoActionDialogOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCargoActionLoading(false);
    }
  };

  const handleCargoImageCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCargoActionImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

`;

content = content.replace('  // Cargo Detail Dialog State', stateBlock + '  // Cargo Detail Dialog State');

const dialogBlock = `      {/* ==================== DIALOG: CARGO ACTION ==================== */}
      <Dialog open={isCargoActionDialogOpen} onOpenChange={setIsCargoActionDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white border-0 shadow-2xl overflow-hidden p-0">
          <div className="bg-[#004b87] px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-white m-0">Cập nhật hình ảnh</DialogTitle>
              <DialogDescription className="text-blue-100 text-xs font-semibold mt-0.5">
                Đơn hàng #{cargoActionData?.item?.id}
              </DialogDescription>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600 font-medium">
              Vui lòng chụp ảnh hoặc tải lên hình ảnh đính kèm để làm bằng chứng xác nhận trạng thái.
            </p>
            
            <div className="relative">
              {!cargoActionImage ? (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 hover:border-[#004b87] transition-all group">
                  <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Camera className="h-6 w-6 text-slate-400 group-hover:text-[#004b87]" />
                  </div>
                  <span className="text-sm font-bold text-slate-600">Nhấn để chụp / tải ảnh lên</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCargoImageCapture} />
                </label>
              ) : (
                <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-slate-200">
                  <img src={cargoActionImage} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setCargoActionImage('')}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors border-none cursor-pointer shadow-md"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsCargoActionDialogOpen(false)} className="rounded-xl font-bold text-slate-600">Hủy</Button>
            <Button 
              onClick={handleCargoActionConfirm} 
              disabled={!cargoActionImage || isCargoActionLoading}
              className="bg-[#004b87] hover:bg-[#003a69] text-white rounded-xl font-bold px-6"
            >
              {isCargoActionLoading ? 'Đang xử lý...' : 'Xác nhận'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
`;

content = content.replace('      {/* ==================== DIALOG: CARGO DETAILS ==================== */}', dialogBlock + '\n      {/* ==================== DIALOG: CARGO DETAILS ==================== */}');

content = content.replace(/const fakeImage = [^;]+;\s*handleCargoStatusUpdate\(item\.id, 'APPROVED', item\.dbId, true, fakeImage\);/g, "openCargoActionDialog(item, 'APPROVED');");
content = content.replace(/if \(fakeImage\) handleCargoStatusUpdate\(item\.id, 'SHIPPING', item\.dbId, item\.isConsignment, fakeImage\);/g, "openCargoActionDialog(item, 'SHIPPING');");

fs.writeFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', content);
console.log('Script updated successfully');
