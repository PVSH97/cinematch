import { useState, useEffect } from 'react'
import { Film, Github, Heart, Sparkles } from 'lucide-react'
import MovieGenreRanker from './components/MovieGenreRanker'
import { initializeMovieApi } from './services/movieApi'

function App() {
  const [showLanding, setShowLanding] = useState(true)

  useEffect(() => {
    // Initialize API with key from environment variable
    const apiKey = import.meta.env.VITE_TMDB_API_KEY
    if (apiKey) {
      initializeMovieApi(apiKey)
    } else {
      console.warn('TMDB API key not configured. Using fallback movie recommendations.')
    }
  }, [])

  if (!showLanding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900">
        <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Film className="w-8 h-8 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">CineMatch</h1>
            </div>
            <button 
              onClick={() => setShowLanding(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm transition-colors"
            >
              About
            </button>
          </div>
        </header>
        <div className="max-w-7xl mx-auto p-4">
          <MovieGenreRanker />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Film className="w-24 h-24 text-purple-400" />
              <Sparkles className="w-8 h-8 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
            </div>
          </div>
          <h1 className="text-6xl font-bold text-white mb-4">CineMatch</h1>
          <p className="text-2xl text-purple-200 mb-8">
            Discover movies tailored to your unique taste
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-purple-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Rate Genres</h3>
              <p className="text-purple-200">Tell us how much you enjoy different movie genres</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Get Matches</h3>
              <p className="text-purple-200">Our algorithm finds movies that match your preferences</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-500/20 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Discover & Enjoy</h3>
              <p className="text-purple-200">Find your next favorite movie from personalized recommendations</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => setShowLanding(false)}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xl rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            Start Discovering Movies
          </button>
        </div>

        <footer className="mt-12 text-center">
          <div className="flex items-center justify-center gap-6 mb-4">
            <a 
              href="https://github.com/PVSH97/cinematch" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-300 hover:text-white transition-colors flex items-center gap-2"
            >
              <Github className="w-5 h-5" />
              View on GitHub
            </a>
          </div>
          <p className="text-purple-300 text-sm">
            Made with <Heart className="w-4 h-4 inline text-red-400" /> by PVSH97
          </p>
          <p className="text-purple-400 text-xs mt-2">
            Powered by The Movie Database (TMDB) API
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
