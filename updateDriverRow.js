const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', 'utf8');

const targetRow = `                                  return (
                                    <TableRow key={item.id}>
                                      <TableCell className="font-black text-slate-800 text-sm">{item.id}</TableCell>`;

const replacementRow = `                                  return (
                                    <TableRow key={item.id} className={item.status === 'CANCELLED' ? 'bg-red-50' : item.isEdited ? 'bg-amber-50' : ''}>
                                      <TableCell className="font-black text-slate-800 text-sm">
                                        {item.id}
                                        {item.isEdited && <div className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-sm mt-1 inline-block">ĐÃ CHỈNH SỬA</div>}
                                      </TableCell>`;

content = content.replace(targetRow, replacementRow);
fs.writeFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', content, 'utf8');
console.log('Injected row styling for DriverDashboard');
