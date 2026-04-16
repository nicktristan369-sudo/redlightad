"use client"

import { useState } from "react"
import { ContactModal } from "@/components/ContactModal"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface ContactInfo {
  phone?: string | null
  whatsapp?: string | null
  telegram?: string | null
  snapchat?: string | null
  email?: string | null
  viber?: string | null
  wechat?: string | null
  line_app?: string | null
  signal?: string | null
  instagram?: string | null
  x_twitter?: string | null
  profileImage?: string | null
  name?: string
}

// Official brand icons (inline SVG)
const Icons = {
  whatsapp: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 258">
      <defs>
        <linearGradient id="wa-c1" x1="50%" x2="50%" y1="100%" y2="0%">
          <stop offset="0%" stopColor="#1faf38"/>
          <stop offset="100%" stopColor="#60d669"/>
        </linearGradient>
      </defs>
      <path fill="url(#wa-c1)" d="M5.463 127.456c-.006 21.677 5.658 42.843 16.428 61.499L4.433 252.697l65.232-17.104a123 123 0 0 0 58.8 14.97h.054c67.815 0 123.018-55.183 123.047-123.01c.013-32.867-12.775-63.773-36.009-87.025c-23.23-23.25-54.125-36.061-87.043-36.076c-67.823 0-123.022 55.18-123.05 123.004"/>
      <path fill="#fff" d="M1.07 127.416c-.007 22.457 5.86 44.38 17.014 63.704L0 257.147l67.571-17.717c18.618 10.151 39.58 15.503 60.91 15.511h.055c70.248 0 127.434-57.168 127.464-127.423c.012-34.048-13.236-66.065-37.3-90.15C194.633 13.286 162.633.014 128.536 0C58.276 0 1.099 57.16 1.071 127.416m40.24 60.376l-2.523-4.005c-10.606-16.864-16.204-36.352-16.196-56.363C22.614 69.029 70.138 21.52 128.576 21.52c28.3.012 54.896 11.044 74.9 31.06c20.003 20.018 31.01 46.628 31.003 74.93c-.026 58.395-47.551 105.91-105.943 105.91h-.042c-19.013-.01-37.66-5.116-53.922-14.765l-3.87-2.295l-40.098 10.513z"/>
      <path fill="#fff" d="M96.678 74.148c-2.386-5.303-4.897-5.41-7.166-5.503c-1.858-.08-3.982-.074-6.104-.074c-2.124 0-5.575.799-8.492 3.984c-2.92 3.188-11.148 10.892-11.148 26.561s11.413 30.813 13.004 32.94c1.593 2.123 22.033 35.307 54.405 48.073c26.904 10.609 32.379 8.499 38.218 7.967c5.84-.53 18.844-7.702 21.497-15.139c2.655-7.436 2.655-13.81 1.859-15.142c-.796-1.327-2.92-2.124-6.105-3.716s-18.844-9.298-21.763-10.361c-2.92-1.062-5.043-1.592-7.167 1.597c-2.124 3.184-8.223 10.356-10.082 12.48c-1.857 2.129-3.716 2.394-6.9.801c-3.187-1.598-13.444-4.957-25.613-15.806c-9.468-8.442-15.86-18.867-17.718-22.056c-1.858-3.184-.199-4.91 1.398-6.497c1.431-1.427 3.186-3.719 4.78-5.578c1.588-1.86 2.118-3.187 3.18-5.311c1.063-2.126.531-3.986-.264-5.579c-.798-1.593-6.987-17.343-9.819-23.64"/>
    </svg>
  ),
  telegram: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256">
      <defs>
        <linearGradient id="tg-c1" x1="50%" x2="50%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#2aabee"/>
          <stop offset="100%" stopColor="#229ed9"/>
        </linearGradient>
      </defs>
      <path fill="url(#tg-c1)" d="M128 0C94.06 0 61.48 13.494 37.5 37.49A128.04 128.04 0 0 0 0 128c0 33.934 13.5 66.514 37.5 90.51C61.48 242.506 94.06 256 128 256s66.52-13.494 90.5-37.49c24-23.996 37.5-56.576 37.5-90.51s-13.5-66.514-37.5-90.51C194.52 13.494 161.94 0 128 0"/>
      <path fill="#fff" d="M57.94 126.648q55.98-24.384 74.64-32.152c35.56-14.786 42.94-17.354 47.76-17.441c1.06-.017 3.42.245 4.96 1.49c1.28 1.05 1.64 2.47 1.82 3.467c.16.996.38 3.266.2 5.038c-1.92 20.24-10.26 69.356-14.5 92.026c-1.78 9.592-5.32 12.808-8.74 13.122c-7.44.684-13.08-4.912-20.28-9.63c-11.26-7.386-17.62-11.982-28.56-19.188c-12.64-8.328-4.44-12.906 2.76-20.386c1.88-1.958 34.64-31.748 35.26-34.45c.08-.338.16-1.598-.6-2.262c-.74-.666-1.84-.438-2.64-.258c-1.14.256-19.12 12.152-54 35.686c-5.1 3.508-9.72 5.218-13.88 5.128c-4.56-.098-13.36-2.584-19.9-4.708c-8-2.606-14.38-3.984-13.82-8.41c.28-2.304 3.46-4.662 9.52-7.072"/>
    </svg>
  ),
  snapchat: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
      <g fill="none">
        <path fill="#ffef5e" d="M22.064 17.711a.827.827 0 0 0 .11-1.552a15 15 0 0 1-2.756-1.654a1.334 1.334 0 0 1 .09-2.189l1.207-.765a1.333 1.333 0 1 0-1.43-2.251L18 10.116V7A6 6 0 1 0 6 7v3.116L4.712 9.3a1.333 1.333 0 1 0-1.43 2.251l1.207.765a1.334 1.334 0 0 1 .09 2.189a15 15 0 0 1-2.756 1.654a.828.828 0 0 0 .11 1.552l1.97.4a.82.82 0 0 1 .57.988a1.282 1.282 0 0 0 1.455 1.575l.626-.1a2.85 2.85 0 0 1 2.48.8A4.7 4.7 0 0 0 12 23a4.7 4.7 0 0 0 2.964-1.63a2.85 2.85 0 0 1 2.48-.8l.627.1a1.282 1.282 0 0 0 1.455-1.57a.82.82 0 0 1 .57-.988z"/>
        <path fill="#fff9bf" d="M11.999 1a6.02 6.02 0 0 0-6 6v3.116L4.712 9.3a1.334 1.334 0 0 0-1.43 2.252l1.207.765a1.334 1.334 0 0 1 .09 2.189a15 15 0 0 1-2.756 1.654a.828.828 0 0 0 .11 1.552l1.97.4q.06.026.115.059L17.525 4.668A6.02 6.02 0 0 0 11.999 1"/>
        <path stroke="#191919" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M22.064 17.711a.827.827 0 0 0 .11-1.552a15 15 0 0 1-2.756-1.654a1.334 1.334 0 0 1 .09-2.189l1.207-.765a1.333 1.333 0 1 0-1.43-2.251L18 10.116V7A6 6 0 1 0 6 7v3.116L4.712 9.3a1.333 1.333 0 1 0-1.43 2.251l1.207.765a1.334 1.334 0 0 1 .09 2.189a15 15 0 0 1-2.756 1.654a.828.828 0 0 0 .11 1.552l1.97.4a.82.82 0 0 1 .57.988a1.282 1.282 0 0 0 1.455 1.575l.626-.1a2.85 2.85 0 0 1 2.48.8A4.7 4.7 0 0 0 12 23a4.7 4.7 0 0 0 2.964-1.63a2.85 2.85 0 0 1 2.48-.8l.627.1a1.282 1.282 0 0 0 1.455-1.57a.82.82 0 0 1 .57-.988z"/>
      </g>
    </svg>
  ),
  signal: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256">
      <path fill="#3a76f0" d="m97.28 3.74l2.88 11.639A115.7 115.7 0 0 0 68 28.678l-6.16-10.28A127.5 127.5 0 0 1 97.28 3.74m61.44 0l-2.88 11.639A115.7 115.7 0 0 1 188 28.678l6.2-10.28A127.5 127.5 0 0 0 158.72 3.74M18.4 61.835A127.5 127.5 0 0 0 3.74 97.272l11.64 2.88a115.7 115.7 0 0 1 13.3-32.157zM12 127.99a116 116 0 0 1 1.3-17.379l-11.86-1.8a128.4 128.4 0 0 0 0 38.358l11.86-1.8A116 116 0 0 1 12 127.99m182.16 109.592l-6.16-10.28a115.7 115.7 0 0 1-32.12 13.3l2.88 11.638a127.5 127.5 0 0 0 35.4-14.658M244 127.99a116 116 0 0 1-1.3 17.379l11.86 1.8a128.4 128.4 0 0 0 0-38.357l-11.86 1.8a116 116 0 0 1 1.3 17.378m8.26 30.718l-11.64-2.88a115.7 115.7 0 0 1-13.3 32.157l10.28 6.2a127.5 127.5 0 0 0 14.66-35.477M145.38 242.7a116.8 116.8 0 0 1-34.76 0l-1.8 11.86a128.5 128.5 0 0 0 38.36 0zm76-45.896a116.4 116.4 0 0 1-24.58 24.558l7.12 9.659a128.2 128.2 0 0 0 27.12-27.038zM196.8 34.617a116.4 116.4 0 0 1 24.58 24.578l9.66-7.2A128.2 128.2 0 0 0 204 24.959zM34.62 59.195A116.4 116.4 0 0 1 59.2 34.617L52 24.958a128.2 128.2 0 0 0-27.04 27.038zm202.98 2.64l-10.28 6.16a115.7 115.7 0 0 1 13.3 32.117l11.64-2.88a127.5 127.5 0 0 0-14.66-35.397M110.62 13.3a116.8 116.8 0 0 1 34.76 0l1.8-11.86a128.5 128.5 0 0 0-38.36 0zM40.78 234.202L16 239.982l5.78-24.779l-11.68-2.74l-5.78 24.779a11.998 11.998 0 0 0 14.42 14.418l24.76-5.68zM12.6 201.764l11.68 2.72l4-17.179a115.5 115.5 0 0 1-12.9-31.477l-11.64 2.88a127 127 0 0 0 11.8 30.417zm56 25.998l-17.18 4l2.72 11.68l12.64-2.94A127 127 0 0 0 97.2 252.3l2.88-11.639a115.5 115.5 0 0 1-31.4-12.979zM128 23.998c-37.843.02-72.69 20.593-90.985 53.717C18.72 110.84 19.863 151.287 40 183.325l-10 42.657l42.66-9.999c37.418 23.566 85.647 20.894 120.233-6.66s47.963-73.965 33.35-115.698C211.63 51.89 172.22 23.962 128 23.998"/>
    </svg>
  ),
  instagram: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256">
      <defs>
        <radialGradient id="ig-c1" cx="0" cy="0" r="1" gradientTransform="matrix(0 -253.715 235.975 0 68 275.717)" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fd5"/>
          <stop offset=".1" stopColor="#fd5"/>
          <stop offset=".5" stopColor="#ff543e"/>
          <stop offset="1" stopColor="#c837ab"/>
        </radialGradient>
        <radialGradient id="ig-c2" cx="0" cy="0" r="1" gradientTransform="rotate(78.68 -32.69 -16.937)scale(113.412 467.488)" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3771c8"/>
          <stop offset=".128" stopColor="#3771c8"/>
          <stop offset="1" stopColor="#60f" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <rect width="256" height="256" fill="url(#ig-c1)" rx="60"/>
      <rect width="256" height="256" fill="url(#ig-c2)" rx="60"/>
      <path fill="#fff" d="M128.009 28c-27.158 0-30.567.119-41.233.604c-10.646.488-17.913 2.173-24.271 4.646c-6.578 2.554-12.157 5.971-17.715 11.531c-5.563 5.559-8.98 11.138-11.542 17.713c-2.48 6.36-4.167 13.63-4.646 24.271c-.477 10.667-.602 14.077-.602 41.236s.12 30.557.604 41.223c.49 10.646 2.175 17.913 4.646 24.271c2.556 6.578 5.973 12.157 11.533 17.715c5.557 5.563 11.136 8.988 17.709 11.542c6.363 2.473 13.631 4.158 24.275 4.646c10.667.485 14.073.604 41.23.604c27.161 0 30.559-.119 41.225-.604c10.646-.488 17.921-2.173 24.284-4.646c6.575-2.554 12.146-5.979 17.702-11.542c5.563-5.558 8.979-11.137 11.542-17.712c2.458-6.361 4.146-13.63 4.646-24.272c.479-10.666.604-14.066.604-41.225s-.125-30.567-.604-41.234c-.5-10.646-2.188-17.912-4.646-24.27c-2.563-6.578-5.979-12.157-11.542-17.716c-5.562-5.562-11.125-8.979-17.708-11.53c-6.375-2.474-13.646-4.16-24.292-4.647c-10.667-.485-14.063-.604-41.23-.604zm-8.971 18.021c2.663-.004 5.634 0 8.971 0c26.701 0 29.865.096 40.409.575c9.75.446 15.042 2.075 18.567 3.444c4.667 1.812 7.994 3.979 11.492 7.48c3.5 3.5 5.666 6.833 7.483 11.5c1.369 3.52 3 8.812 3.444 18.562c.479 10.542.583 13.708.583 40.396s-.104 29.855-.583 40.396c-.446 9.75-2.075 15.042-3.444 18.563c-1.812 4.667-3.983 7.99-7.483 11.488c-3.5 3.5-6.823 5.666-11.492 7.479c-3.521 1.375-8.817 3-18.567 3.446c-10.542.479-13.708.583-40.409.583c-26.702 0-29.867-.104-40.408-.583c-9.75-.45-15.042-2.079-18.57-3.448c-4.666-1.813-8-3.979-11.5-7.479s-5.666-6.825-7.483-11.494c-1.369-3.521-3-8.813-3.444-18.563c-.479-10.542-.575-13.708-.575-40.413s.096-29.854.575-40.396c.446-9.75 2.075-15.042 3.444-18.567c1.813-4.667 3.983-8 7.484-11.5s6.833-5.667 11.5-7.483c3.525-1.375 8.819-3 18.569-3.448c9.225-.417 12.8-.542 31.437-.563zm62.351 16.604c-6.625 0-12 5.37-12 11.996c0 6.625 5.375 12 12 12s12-5.375 12-12s-5.375-12-12-12zm-53.38 14.021c-28.36 0-51.354 22.994-51.354 51.355s22.994 51.344 51.354 51.344c28.361 0 51.347-22.983 51.347-51.344c0-28.36-22.988-51.355-51.349-51.355zm0 18.021c18.409 0 33.334 14.923 33.334 33.334c0 18.409-14.925 33.334-33.334 33.334s-33.333-14.925-33.333-33.334c0-18.411 14.923-33.334 33.333-33.334"/>
    </svg>
  ),
  x: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 128 128">
      <path d="M75.916 54.2L122.542 0h-11.05L71.008 47.06L38.672 0H1.376l48.898 71.164L1.376 128h11.05L55.18 78.303L89.328 128h37.296L75.913 54.2ZM60.782 71.79l-4.955-7.086l-39.42-56.386h16.972L65.19 53.824l4.954 7.086l41.353 59.15h-16.97L60.782 71.793Z"/>
    </svg>
  ),
  email: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
      <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64L12 9.548l6.545-4.91l1.528-1.145C21.69 2.28 24 3.434 24 5.457"/>
    </svg>
  ),
  viber: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 258">
      <path fill="#7360F2" d="M128.038 0c26.682.157 53.017 4.527 78.612 15.106c21.108 8.728 38.567 22.612 52.92 40.399c17.99 22.29 28.323 47.765 33.117 75.645c2.655 15.429 3.53 30.987 2.695 46.572c-.998 18.678-4.912 36.768-12.38 54.043c-7.94 18.378-19.334 34.01-34.012 47.143c-18.073 16.176-38.987 26.697-62.4 32.507c-12.856 3.191-25.978 4.728-39.238 5.005c-17.377.363-34.426-1.845-51.156-6.698c-10.138-2.944-19.732-7.087-28.977-12.133a13.855 13.855 0 0 0-7.023-1.872c-5.59.337-11.173.81-16.76 1.198c-10.535.731-21.082 1.318-31.575 2.36C7.573 299.646 3.538 299.994 0 300l.03-1.085c.445-11.07.955-22.137 1.328-33.209c.266-7.892.297-15.791.523-23.685c.115-4.048-1.123-7.584-3.232-10.905C-14.85 208.98-20.13 184.02-20.038 156.53c.047-14.115 2.035-27.998 5.567-41.623c5.974-23.036 16.747-43.474 32.37-61.26C35.18 33.724 56.22 18.667 80.902 8.794C95.875 2.824 111.522.203 127.48.018c.186-.003.372-.012.558-.018"/>
      <path fill="#FFF" d="M115.553 76.931c13.764-1.063 27.348.59 40.382 5.182c21.412 7.54 36.893 21.712 46.275 42.24c4.47 9.772 6.913 20.16 7.512 30.96c.09 1.635.174 3.27.195 4.907c.05 3.796-2.87 7.018-6.575 7.493c-3.764.483-7.158-1.687-8.185-5.283c-.399-1.396-.452-2.9-.503-4.359c-.16-4.556-.09-9.145-.594-13.66c-1.59-14.258-7.333-26.518-17.713-36.432c-8.09-7.724-17.775-12.632-28.74-15.13c-6.09-1.388-12.31-1.93-18.554-2.2c-4.213-.183-7.243-3.712-6.96-7.738c.277-3.947 3.592-6.636 7.62-6.358c1.958.137 3.914.232 5.84.378m-1.106 30.167c8.08-.153 16.055 1.046 23.614 4.253c14.076 5.973 23.248 16.298 27.336 31.033c1.586 5.717 2.06 11.608 2.13 17.526c.034 2.9-1.767 5.34-4.414 6.297c-4.188 1.516-8.58-1.339-9.055-5.908c-.193-1.864-.178-3.764-.426-5.62c-.812-6.087-2.163-12.008-5.422-17.317c-4.706-7.668-11.577-12.39-20.263-14.527c-4.343-1.069-8.808-1.338-13.263-1.473c-3.566-.108-6.315-2.654-6.656-5.99c-.377-3.69 2.17-7.25 5.913-8.013c.156-.032.328-.015.506-.261m65.5 99.453c-1.23 4.347-4.165 7.08-8.206 8.693c-4.478 1.786-8.825 1.225-13.072-.748c-10.534-4.893-20.523-10.635-29.921-17.323c-13.07-9.298-25.097-19.72-35.555-31.857c-6.587-7.646-12.605-15.725-17.49-24.606c-4.227-7.681-7.64-15.72-9.568-24.34c-1.05-4.695-.34-9.142 2.408-13.195c2.424-3.576 5.844-5.676 10.146-6.275c2.53-.352 4.89.265 7.076 1.503c2.686 1.521 4.42 3.86 5.834 6.506c2.964 5.545 5.831 11.145 8.817 16.677c1.598 2.962 2.163 6.006.955 9.182c-1.019 2.68-2.682 4.944-4.65 6.938c-.99 1.003-2.021 1.97-2.95 3.03c-1.705 1.94-1.942 4.044-.946 6.368c4.247 9.913 10.66 18.174 18.73 25.1c5.625 4.832 11.73 9.047 18.423 12.425c2.916 1.473 5.584 1.193 8.038-.875c1.47-1.239 2.826-2.63 4.098-4.076c3.072-3.491 6.838-4.496 11.165-2.905c2.765.988 5.425 2.287 8.063 3.59c4.428 2.188 8.776 4.528 13.21 6.702c3.086 1.513 5.19 3.838 5.845 7.284c.42 2.21.128 4.35-.45 6.202m-66.35-81.093c1.66-.092 2.994-.19 4.33-.224c6.77-.17 12.287 4.053 13.985 10.527c.608 2.32.636 4.761.892 7.15c.2 1.87.304 3.753.522 5.62c.41 3.517 3.3 6.034 6.75 6.008c3.446-.026 6.24-2.507 6.574-5.975c.5-5.206.333-10.388-.855-15.496c-2.588-11.135-10.498-18.77-21.684-21.255c-4.423-.983-8.964-1.076-13.476-.738c-4.017.302-6.993 3.595-6.79 7.513c.217 4.195 3.612 7.032 7.81 6.893c.648-.023 1.294-.016 1.942-.023"/>
    </svg>
  ),
  wechat: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 209">
      <path fill="#2DC100" d="M93.243 0C44.082 0 3.906 32.512 3.906 74.818c0 23.376 12.314 44.057 31.98 57.96c-1.423 7.118-5.129 19.26-16.818 27.85c0 0 24.41-5.522 41.903-20.057c9.926 2.788 20.7 4.47 31.989 4.47c2.803 0 5.58-.112 8.334-.285c-1.675-5.57-2.678-11.396-2.678-17.445c0-42.065 39.904-76.13 89.203-76.13c2.62 0 5.209.12 7.773.318C188.228 22.27 144.306 0 93.243 0"/>
      <path fill="#00C800" d="M255.94 127.311c0-34.975-34.953-63.346-78.035-63.346c-43.08 0-78.037 28.371-78.037 63.346c0 35.006 34.957 63.345 78.037 63.345c9.053 0 17.751-1.414 25.826-3.91l17.769 9.835l-5.297-17.527c18.632-13.036 39.737-30.478 39.737-51.743"/>
    </svg>
  ),
  line: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 256 256">
      <path fill="#00B900" d="M128 0C57.307 0 0 44.86 0 100.144c0 49.478 43.863 90.913 103.129 98.727c4.015.869 9.474 2.656 10.858 6.099c1.248 3.122.817 8.002.4 11.152l-1.752 10.484c-.537 3.123-2.478 12.23 10.73 6.668s71.361-42.024 97.394-71.938l.001-.001C240.376 138.805 256 120.56 256 100.144C256 44.86 198.693 0 128 0"/>
      <path fill="#FFF" d="M108.31 79.262H96.835a3.278 3.278 0 0 0-3.277 3.277v47.665a3.278 3.278 0 0 0 3.277 3.276h11.475a3.278 3.278 0 0 0 3.276-3.276V82.539a3.278 3.278 0 0 0-3.276-3.277m53.488 0h-11.475a3.278 3.278 0 0 0-3.277 3.277v28.321l-16.307-30.017a3.27 3.27 0 0 0-.243-.385l-.004-.005l-.175-.238l-.008-.01a3 3 0 0 0-.193-.217l-.037-.038l-.153-.144l-.061-.054a3 3 0 0 0-.165-.129l-.07-.05a3 3 0 0 0-.172-.112l-.073-.044a3 3 0 0 0-.188-.1l-.071-.034q-.1-.046-.205-.082l-.067-.024a3 3 0 0 0-.213-.06l-.061-.016a3 3 0 0 0-.222-.04l-.053-.009a3 3 0 0 0-.272-.022h-11.475a3.278 3.278 0 0 0-3.277 3.277v47.665a3.278 3.278 0 0 0 3.277 3.276h11.475a3.278 3.278 0 0 0 3.277-3.276v-28.32l16.333 30.058q.08.149.176.287a3.3 3.3 0 0 0 2.6 1.258h11.475a3.278 3.278 0 0 0 3.277-3.276V82.539a3.278 3.278 0 0 0-3.277-3.277m-72.073 36.138H72.31V82.539a3.278 3.278 0 0 0-3.277-3.277H57.558a3.278 3.278 0 0 0-3.277 3.277v47.665q0 .716.312 1.372l.001.003l.002.003a3.27 3.27 0 0 0 2.963 1.898h32.166a3.278 3.278 0 0 0 3.277-3.276v-11.528a3.278 3.278 0 0 0-3.277-3.277m110.463-36.138h-32.166a3.278 3.278 0 0 0-3.277 3.277v47.665a3.278 3.278 0 0 0 3.277 3.276h32.166a3.278 3.278 0 0 0 3.277-3.276v-11.527a3.278 3.278 0 0 0-3.277-3.277h-17.414V101.2h17.414a3.278 3.278 0 0 0 3.277-3.277v-11.528a3.278 3.278 0 0 0-3.277-3.276h-17.414v-10.11h17.414a3.278 3.278 0 0 0 3.277-3.276V58.206a3.278 3.278 0 0 0-3.277-3.277"/>
    </svg>
  ),
};

export default function ContactSection({ contact }: { contact: ContactInfo }) {
  const { t } = useLanguage()
  const [modalOpen, setModalOpen] = useState(false)

  const hasPhone = !!(contact.phone || contact.whatsapp)
  const hasTelegram = !!contact.telegram
  const hasEmail = !!contact.email
  const hasSnapchat = !!contact.snapchat
  const hasViber = !!contact.viber
  const hasWechat = !!contact.wechat
  const hasLine = !!contact.line_app
  const hasSignal = !!contact.signal
  const hasInstagram = !!contact.instagram
  const hasX = !!contact.x_twitter

  if (!hasPhone && !hasTelegram && !hasEmail && !hasSnapchat && !hasViber && !hasWechat && !hasLine && !hasSignal && !hasInstagram && !hasX) return null

  const rowStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
    borderBottom: "1px solid #F3F4F6", textDecoration: "none", cursor: "pointer",
    background: "#fff", width: "100%", border: "none", textAlign: "left" as const,
    transition: "background 0.15s",
  }

  const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9CA3AF", marginBottom: 2 }
  const valueStyle: React.CSSProperties = { fontSize: 14, fontWeight: 500, color: "#374151", letterSpacing: "0.1em" }
  const btnStyle = (bg: string, color = "#fff"): React.CSSProperties => ({
    marginLeft: "auto", flexShrink: 0, fontSize: 12, fontWeight: 600,
    padding: "8px 16px", borderRadius: 8, background: bg, color, border: "none", cursor: "pointer"
  })

  return (
    <>
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #F3F4F6" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111", margin: 0 }}>{t.contact_info}</h3>
        </div>

        {/* Phone / WhatsApp */}
        {hasPhone && (
          <button onClick={() => setModalOpen(true)} style={rowStyle} onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
            <div style={{ flexShrink: 0 }}>{Icons.whatsapp}</div>
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>{t.contact_phone}</p>
              <p style={valueStyle}>••••••••••</p>
            </div>
            <span style={btnStyle("#DC2626")}>{t.contact_show}</span>
          </button>
        )}

        {/* Telegram */}
        {hasTelegram && (
          <a href={`https://t.me/${contact.telegram}`} target="_blank" rel="noopener noreferrer"
            style={rowStyle} onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
            <div style={{ flexShrink: 0 }}>{Icons.telegram}</div>
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>Telegram</p>
              <p style={valueStyle}>••••••••••</p>
            </div>
            <span style={btnStyle("#0088CC")}>{t.contact_open}</span>
          </a>
        )}

        {/* Signal */}
        {hasSignal && (
          <div style={rowStyle}>
            <div style={{ flexShrink: 0 }}>{Icons.signal}</div>
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>Signal</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>{contact.signal}</p>
            </div>
          </div>
        )}

        {/* Snapchat */}
        {hasSnapchat && (
          <div style={rowStyle}>
            <div style={{ flexShrink: 0 }}>{Icons.snapchat}</div>
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>Snapchat</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>{contact.snapchat}</p>
            </div>
          </div>
        )}

        {/* Instagram */}
        {hasInstagram && (
          <a href={`https://instagram.com/${contact.instagram?.replace("@","")}`} target="_blank" rel="noopener noreferrer"
            style={rowStyle} onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
            <div style={{ flexShrink: 0 }}>{Icons.instagram}</div>
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>Instagram</p>
              <p style={valueStyle}>••••••••••</p>
            </div>
            <span style={btnStyle("#E1306C")}>{t.contact_open}</span>
          </a>
        )}

        {/* X / Twitter */}
        {hasX && (
          <a href={`https://x.com/${contact.x_twitter?.replace("@","")}`} target="_blank" rel="noopener noreferrer"
            style={rowStyle} onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
            <div style={{ flexShrink: 0 }}>{Icons.x}</div>
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>X / Twitter</p>
              <p style={valueStyle}>••••••••••</p>
            </div>
            <span style={btnStyle("#111")}>{t.contact_open}</span>
          </a>
        )}

        {/* Viber */}
        {hasViber && (
          <a href={`viber://chat?number=${contact.viber}`}
            style={rowStyle} onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
            <div style={{ flexShrink: 0 }}>{Icons.viber}</div>
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>Viber</p>
              <p style={valueStyle}>••••••••••</p>
            </div>
            <span style={btnStyle("#7360F2")}>{t.contact_open}</span>
          </a>
        )}

        {/* WeChat */}
        {hasWechat && (
          <div style={rowStyle}>
            <div style={{ flexShrink: 0 }}>{Icons.wechat}</div>
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>WeChat</p>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>{contact.wechat}</p>
            </div>
          </div>
        )}

        {/* LINE */}
        {hasLine && (
          <a href={`https://line.me/ti/p/${contact.line_app}`} target="_blank" rel="noopener noreferrer"
            style={rowStyle} onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
            <div style={{ flexShrink: 0 }}>{Icons.line}</div>
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>LINE</p>
              <p style={valueStyle}>••••••••••</p>
            </div>
            <span style={btnStyle("#00B900")}>{t.contact_open}</span>
          </a>
        )}

        {/* Email */}
        {hasEmail && (
          <a href={`mailto:${contact.email}`}
            style={{ ...rowStyle, borderBottom: "none" }} onMouseEnter={e => e.currentTarget.style.background = "#FAFAFA"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
            <div style={{ flexShrink: 0 }}>{Icons.email}</div>
            <div style={{ flex: 1 }}>
              <p style={labelStyle}>Email</p>
              <p style={valueStyle}>••••••••••</p>
            </div>
            <span style={btnStyle("#F3F4F6", "#374151")}>{t.contact_open}</span>
          </a>
        )}
      </div>

      {modalOpen && (
        <ContactModal
          phone={contact.phone ?? null}
          whatsapp={contact.whatsapp ?? null}
          profileImage={contact.profileImage}
          name={contact.name}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}
