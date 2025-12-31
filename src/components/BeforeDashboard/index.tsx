import { Banner } from '@payloadcms/ui/elements/Banner'
import React from 'react'

import { TranslationButton } from './TranslationButton'
import './index.scss'

const baseClass = 'before-dashboard'

const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Welcome to your dashboard!</h4>
      </Banner>
      Here&apos;s what to do next:
      <ul className={`${baseClass}__instructions`}>
        <li>
          <TranslationButton />
          {
            ' to automatically translate all existing English content to French. Only content without French translations will be translated.'
          }
        </li>
      </ul>
    </div>
  )
}

export default BeforeDashboard
