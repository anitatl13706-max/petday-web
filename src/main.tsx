import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import ToastProvider from './ToastProvider';

interface BoundaryState { error: string | null }
class PetDayErrorBoundary extends React.Component<React.PropsWithChildren, BoundaryState> {
  state: BoundaryState = {error: null};
  static getDerivedStateFromError(error: Error): BoundaryState {
    return {error: error?.message || 'Lỗi không xác định khi tải giao diện'};
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[PetDay] React render error:', error, info.componentStack);
    window.dispatchEvent(new CustomEvent('petday:boot-error', {detail: error.message}));
  }
  render() {
    if (!this.state.error) return this.props.children;
    return <main style={{minHeight:'100vh',background:'#F5F8FD',padding:'min(8vw,64px) 20px',fontFamily:'system-ui, sans-serif',color:'#142B55'}}>
      <section role="alert" style={{maxWidth:680,margin:'auto',background:'#fff',padding:32,borderRadius:24,boxShadow:'0 12px 45px #142B5518'}}>
        <p style={{color:'#FF765E',fontWeight:800}}>PETDAY • KHÔI PHỤC GIAO DIỆN</p>
        <h1 style={{fontSize:26,margin:'10px 0'}}>Không thể hiển thị trang này</h1>
        <p>Đã phát hiện lỗi trong giao diện. Dữ liệu PostgreSQL không bị xóa bởi thông báo này.</p>
        <details style={{padding:'12px 0'}}><summary>Chi tiết kỹ thuật</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{this.state.error}</pre></details>
        <button type="button" onClick={()=>window.location.reload()} style={{padding:'12px 20px',background:'#142B55',color:'white',border:'none',borderRadius:12,cursor:'pointer'}}>Tải lại trang</button>
        <a style={{marginLeft:14,color:'#142B55'}} href="/#kiem-tra-he-thong">Kiểm tra hệ thống</a>
      </section>
    </main>;
  }
}

const root = document.getElementById('root');
if (!root) throw new Error('Không tìm thấy phần tử #root của ứng dụng.');
ReactDOM.createRoot(root).render(
  <React.StrictMode><PetDayErrorBoundary><ToastProvider><App /></ToastProvider></PetDayErrorBoundary></React.StrictMode>
);
