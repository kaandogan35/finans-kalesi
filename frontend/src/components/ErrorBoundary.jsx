import { Component } from 'react'

/**
 * React Error Boundary — Beklenmedik hatalarda uygulamanın çökmesini önler.
 * Hata yakalayıp kullanıcıya anlamlı bir mesaj gösterir.
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hataVar: false, hata: null }
  }

  static getDerivedStateFromError(error) {
    return { hataVar: true, hata: error }
  }

  componentDidCatch(error, errorInfo) {
    void error
    void errorInfo
  }

  render() {
    if (this.state.hataVar) {
      return (
        <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 p-4">
          <div className="text-center" style={{ maxWidth: 480 }}>
            <i className="bi bi-exclamation-triangle-fill text-warning" style={{ fontSize: '3rem' }}></i>
            <h4 className="mt-3 mb-2">Bir şeyler ters gitti</h4>
            <p className="text-muted mb-4">
              Beklenmedik bir hata oluştu. Sayfayı yenileyerek tekrar deneyebilirsiniz.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
