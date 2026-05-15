import { useState, useEffect } from 'react'; 
import { createPortal } from 'react-dom';

export function Reward() {
  const [method, setMethod] = useState(''); // '', 'menu', 'ali', 'wx'
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (method !== '') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [method]);

  if (!mounted) return null;

  const close = () => setMethod('');

  const ModalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      style={{ zIndex: 1000000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={close}
    >
      <div 
        /* 💡 保持 max-w-[450px] 不变 */
        className="bg-white rounded-[2.5rem] w-full max-w-[450px] p-9 relative shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={close} className="absolute right-6 top-6 text-gray-300 hover:text-gray-500 text-3xl font-light">✕</button>
        <h4 className="text-xl font-black text-center mb-8 text-gray-800 tracking-tight">感谢您的支持</h4>

        {method === '' || method === 'menu' ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setMethod('ali')} className="flex flex-col items-center py-7 border border-gray-50 rounded-2xl hover:bg-[#0f766e]/10 hover:border-[#0f766e]/30 transition-all gap-2 group">
                <img src="/assets/ali_icon.png" className="w-12 h-12 group-hover:scale-110 transition-transform object-contain" alt="Ali" />
                <span className="text-sm font-bold text-gray-500">支付宝</span>
              </button>
              <button onClick={() => setMethod('wx')} className="flex flex-col items-center py-7 border border-gray-50 rounded-2xl hover:bg-[#0f766e]/10 hover:border-[#0f766e]/30 transition-all gap-2 group">
                <img src="/assets/wx_icon.png" className="w-12 h-12 group-hover:scale-110 transition-transform object-contain" alt="Wx" />
                <span className="text-sm font-bold text-gray-500">微信支付</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center animate-in fade-in duration-200">
            <div className="w-83 h-83 bg-white rounded-3xl mb-6 border border-gray-50 flex items-center justify-center overflow-hidden shadow-inner">
              <img
                src={method === 'ali' ? '/assets/alipay.png' : '/assets/wechat.png'}
                className="w-full h-full object-contain p-2"
                alt="QR"
              />
            </div>

            <button onClick={() => setMethod('menu')} className="text-gray-400 font-bold text-sm underline underline-offset-8">
              返回选择其他方式
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center my-10 py-8 border-t border-gray-100">
      <button 
        onClick={() => setMethod('menu')}
       className="bg-gradient-to-r from-[#0f766e] to-[#134e4a] text-white px-12 py-4 rounded-full font-bold shadow-lg hover:shadow-[#0f766e]/30 hover:scale-105 active:scale-95 transition-all text-sm"
      >
        ❤️ 请老板喝杯咖啡
      </button>

      {method !== '' && createPortal(ModalContent, document.body)}
    </div>
  );
}
