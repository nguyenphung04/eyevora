import axios from 'axios';
import { toast } from 'react-toastify';

const instance = axios.create({
    baseURL: 'http://localhost:8080/api/v1',
    timeout: 20000,
});
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.log("Lỗi từ backend:", error);
    if (error.response && error.response.status === 401) {
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      toast.error("Phiên đăng nhập hết hạn hoặc tài khoản bị khóa. Vui lòng đăng nhập lại!");
      
      setTimeout(() => {
        window.location.href = '/login'; 
      }, 4500);
    }
    return Promise.reject(error);
  }
);
export default instance;