import { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/router'

export default function Dashboard() {
  const [grants, setGrants] = useState([])
  const [file, setFile] = useState(null)
  const [feedback, setFeedback] = useState('')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/')
    } else {
      fetchGrants()
    }
  }, [])

  const fetchGrants = async () => {
    try {
      const response = await axios.get('/api/grants', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      setGrants(response.data)
    } catch (error) {
      console.error('Error fetching grants:', error)
    }
  }

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post('/api/analyze_grant', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      setFeedback(response.data.feedback)
    } catch (error) {
      console.error('Error analyzing grant:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Analyze Grant Application</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700">
              Upload Grant Application
            </label>
            <input
              type="file"
              id="file"
              onChange={handleFileChange}
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Analyze
          </button>
        </form>
        {feedback && (
          <div className="mt-4 p-4 bg-gray-100 rounded-md">
            <h3 className="text-lg font-semibold mb-2">Feedback:</h3>
            <pre className="whitespace-pre-wrap">{feedback}</pre>
          </div>
        )}
      </div>

      <h2 className="text-2xl font-semibold mb-4">Your Grants</h2>
      <ul className="divide-y divide-gray-200">
        {grants.map((grant, index) => (
          <li key={index} className="py-4">
            <h3 className="text-xl font-semibold">{grant.title}</h3>
            <p className="text-gray-600">{grant.description}</p>
            <p className="text-gray-500">Budget: ${grant.budget.toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}