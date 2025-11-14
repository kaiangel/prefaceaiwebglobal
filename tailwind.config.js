module.exports = {
    content: [
      './pages/**/*.{js,jsx,ts,tsx}',
      './components/**/*.{js,jsx,ts,tsx}'
    ],
    theme: {
      extend: {
        colors: {
          green: {
            50: '#E8F5E9',
            600: '#43B692', // 主色调
          },
          blue: {
            500: '#3F88C5', // 次色调
          }
        },
        animation: {
          blink: 'blink 1s step-end infinite',
        },
        keyframes: {
          blink: {
            '50%': { opacity: '0' },
          }
        }
      },
    },
    plugins: [],
  }