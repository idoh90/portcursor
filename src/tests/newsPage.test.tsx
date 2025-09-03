import { describe, it, expect } from 'vitest'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import ReactDOMServer from 'react-dom/server'
import NewsPage from '@/pages/news/NewsPage'

describe('NewsPage', () => {
  it('renders skeletons without crashing', () => {
    const html = ReactDOMServer.renderToString(
      <BrowserRouter>
        <NewsPage />
      </BrowserRouter>
    )
    expect(typeof html).toBe('string')
  })
})

