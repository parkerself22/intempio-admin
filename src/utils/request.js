import axios from 'axios'
import { Message, MessageBox } from 'element-ui'
import store from '../store'
import { getToken } from '@/utils/auth'

// Create axios instance
const service = axios.create({
  baseURL: process.env.BASE_API, // Api base_url
  timeout: 15000 // Request timeout
})

// Request interceptor
service.interceptors.request.use(config => {
  if (getToken()) {
    config.headers['Authorization'] = 'Token ' + getToken()
  }
  return config
}, error => {
  // Do something with request error
  console.log(error) // for debug
  Promise.reject(error)
})

// Response interceptor
service.interceptors.response.use(
  response => {
    /**
     * The code is non-200 error-free
     */
    const code = response.status
    if (code !== 200 && code !== 204 && code !== 201) {
      Message({
        message: response.statusText,
        type: 'error',
        duration: 5 * 1000
      })

      // 50008: illegal token; 50012: other client logged in; 50014: Token expired;
      if (code === 50008 || code === 50012 || code === 50014) {
        MessageBox.confirm('You have been logged out and can cancel to stay on this page，Or log in again',
          'Confirm logout', {
            confirmButtonText: 're-register',
            cancelButtonText: 'cancel',
            type: 'warning'
          }).then(() => {
          store.dispatch('FedLogOut').then(() => {
            location.reload()// To re-instantiate the vue-router object Avoid bugs
          })
        })
      }
      return Promise.reject('error')
    } else {
      return response.data
    }
  },
  error => {
    const { response } = error
    const duration = 5 * 1000

    if (response.status === 400) {
      Message({
        message: response.data['non_field_errors'][0],
        type: 'error',
        duration
      })
    } else if (response.status === 403) {
      Message({
        message: 'Invalid Token please reload the page and relogin',
        type: 'error',
        duration
      })
    } else if (response.status === 500) {
      Message({
        message: error.message + '- Please reload the page or contact the developer',
        type: 'error',
        duration
      })
    } else {
      Message({
        message: error.message,
        type: 'error',
        duration
      })
    }

    console.log('err' + error)// for debug
    return Promise.reject(error)
  }
)

export default service