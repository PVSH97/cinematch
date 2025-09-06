# CineMatch 🎬

Discover movies tailored to your unique taste with an interactive genre ranking system.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/PVSH97/cinematch)

## Features ✨

- **Interactive Genre Rating**: Rate 27 different movie genres on a scale of 1-5
- **Smart Recommendations**: Get personalized movie suggestions based on your preferences
- **TMDB Integration**: Real-time movie data from The Movie Database API
- **Beautiful UI**: Modern, responsive design with smooth animations
- **Smart Caching**: Efficient local caching for better performance
- **Movie Details**: View ratings, descriptions, and posters for recommended films

## Quick Start 🚀

### Prerequisites

- Node.js 18+ and npm
- TMDB API key ([Get one free](https://www.themoviedb.org/settings/api))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/PVSH97/cinematch.git
cd cinematch
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Add your TMDB API key to `.env`:
```
VITE_TMDB_API_KEY=your_api_key_here
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:5173](http://localhost:5173) in your browser

## Deployment 🌐

### Deploy to Vercel (Recommended)

1. Click the "Deploy with Vercel" button above
2. Connect your GitHub account
3. Add your TMDB API key as an environment variable:
   - Key: `VITE_TMDB_API_KEY`
   - Value: Your TMDB API key
4. Deploy!

### Manual Deployment

Build the project:
```bash
npm run build
```

The built files will be in the `dist` directory, ready to be deployed to any static hosting service.

## Technology Stack 💻

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **API**: The Movie Database (TMDB)
- **HTTP Client**: Axios

## How It Works 🎯

1. **Rate Genres**: Users rate their interest in various movie genres
2. **Smart Matching**: The app analyzes ratings to identify preferred genre combinations
3. **API Integration**: Fetches highly-rated movies from TMDB based on preferences
4. **Personalized Results**: Displays curated movie recommendations with posters and details

## Environment Variables 🔐

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_TMDB_API_KEY` | Your TMDB API key | Yes |
| `VITE_TMDB_REGION` | Region for localized results (US, GB, FR, etc.) | No |

## Development 🛠️

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
cinematch/
├── src/
│   ├── components/     # React components
│   ├── services/       # API and cache services
│   ├── constants/      # Genre mappings and constants
│   ├── types/          # TypeScript type definitions
│   ├── App.tsx         # Main application component
│   └── main.tsx        # Application entry point
├── public/             # Static assets
└── .env.example        # Environment variables template
```

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License 📄

This project is open source and available under the MIT License.

## Credits 🙏

- Movie data provided by [The Movie Database (TMDB)](https://www.themoviedb.org/)
- Icons by [Lucide](https://lucide.dev/)
- Built with [Vite](https://vitejs.dev/) and [React](https://react.dev/)

## Author 👨‍💻

Created by [PVSH97](https://github.com/PVSH97)

---

Made with ❤️ for movie lovers everywhere
