# **App Name**: BioCraft Studio

## Overview

BioCraft Studio is a web application for biotech recipe generation and improvement using AI technologies. The platform allows users to create, optimize, save, and share detailed biotech protocols and recipes for their research needs.

## Architecture

### Frontend
- **Framework**: Next.js with TypeScript
- **Styling**: Tailwind CSS with custom variables
- **UI Components**: ShadCN UI component library
- **State Management**: React Context API for recipe and authentication state

### Backend
- **Server**: Express.js
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth with JWT tokens
- **AI Model**: Google Gemini 2.0 Flash via Genkit

## Core Features and User Flow

### Landing Page
- **Introduction**: Compelling hero section explaining core platform benefits
- **Feature Highlights**: Grid of key features showcasing AI-powered recipes, optimization, management, and collaboration
- **Trusted-by Section**: Display of partner organizations
- **Login/Demo Options**: Buttons to sign in or try the demo

### Authentication System
- **User Registration**: Email/password signup with validation
- **Login Options**: Traditional email/password or OAuth via Google/GitHub
- **Password Management**: Forgot password, reset functionality
- **Profile Management**: Edit account details, change password

### Recipe Generation & Improvement
- **AI-Powered Generation**: Create biotech recipes from ingredients and desired outcomes
- **Recipe Improvement**: Enhance existing recipes by specifying desired improvements
- **Structured Display**: Clear, organized presentation of recipe components
- **Format Standardization**: JSON schema for consistent recipe structure

### Recipe Management
- **Saved Recipes**: View, search, and manage personal recipe library
- **Recipe Details**: View comprehensive details in standardized format
- **PDF Export**: Generate professional PDF documents from recipes
- **Delete Functionality**: Remove recipes from personal collection

### User Experience
- **Responsive Design**: Optimized layout for mobile, tablet, and desktop
- **Tab Navigation**: Easy switching between generation/improvement modes
- **Toast Notifications**: Informative feedback on user actions
- **Error Handling**: Graceful error states and user recovery paths

## Data Models

### Recipe Schema
```
{
  "recipeName": String,
  "description": String,
  "version": String,
  "author": String,
  "dateCreated": Date,
  "Materials": [
    {
      "name": String,
      "quantity": String,
      "supplier": String
    }
  ],
  "Procedure": [
    {
      "title": String,
      "steps": [String]
    }
  ],
  "Troubleshooting": [
    {
      "issue": String,
      "solution": String
    }
  ],
  "Notes": [
    {
      "note": String
    }
  ]
}
```

### User Profile Schema
```
{
  "user_id": String,
  "email": String,
  "created_at": Date,
  "updated_at": Date,
  "last_login": Date,
  "full_name": String,
  "organization": String,
  "role": String
}
```

## Authentication Flow
1. **Registration**: User signs up via email/password or OAuth provider
2. **Verification**: Email verification for account activation
3. **Login**: Authenticate and receive JWT token
4. **Session Management**: Store token in localStorage with expiration
5. **Auto-renewal**: Refresh expired tokens when possible
6. **Logout**: Clear tokens and redirect to landing page

## AI Integration
- **Recipe Generation**: Input ingredients and desired outcomes to generate structured recipes
- **Recipe Improvement**: Submit existing recipes for AI-powered enhancement
- **Genkit Framework**: Integration with Google AI for reliable model access
- **Prompt Engineering**: Specialized prompts designed for optimal recipe generation

## Style Guidelines

### Color Palette
- **Primary**: Teal (#008080) - Scientific precision and biotech focus
- **Secondary**: Light Gray (#D3D3D3) - Clean, modern aesthetic
- **Accent**: Electric Green (#7CFC00) - Interactive elements and highlights
- **Background**: White/Dark based on theme preference
- **Text**: Dark gray for readability

### Typography
- **Font Family**: System UI stack for optimal cross-platform display
- **Headings**: Bold weight with primary color for section titles
- **Body Text**: Regular weight with high contrast for readability

### Component Design
- **Cards**: Subtle shadows with rounded corners for content containers
- **Buttons**: Clear visual hierarchy based on action importance
- **Forms**: Consistent spacing and validation feedback
- **Tables**: Clean lines with hover states for interactivity

### Recipe Presentation
- **Section Headings**: Clear visual hierarchy with primary color
- **Materials**: Organized list with supplier information
- **Procedures**: Numbered steps with nested alpha-numeric sub-steps
- **Troubleshooting**: Highlighted boxes with issue/solution format
- **Notes**: Subtle background with bulleted presentation

## Responsive Design Strategy
- **Mobile-First**: Core functionality optimized for smaller screens
- **Tablet Adaptations**: Adjusted layouts for medium viewports
- **Desktop Enhancements**: Expanded views and side-by-side content
- **Navigation**: Hamburger menu for mobile, horizontal nav for desktop
- **Custom Hooks**: Dedicated hooks for viewport detection and responsive rendering

## Security Considerations
- **Authentication**: JWT-based with secure storage practices
- **Password Requirements**: Enforced complexity and security standards
- **Data Protection**: Server-side validation for all inputs
- **API Security**: Proper authorization checks on endpoints
- **Error Handling**: Non-revealing error messages in production

## Future Enhancements
- **Collaborative Editing**: Real-time recipe collaboration features
- **Version History**: Track changes to recipes over time
- **Categories & Tags**: Better organization of saved recipes
- **Template Library**: Pre-defined templates for common biotech procedures
- **Public Recipe Repository**: Community sharing and discovery features
- **Advanced Search**: Semantic search capabilities for recipe discovery
- **Mobile App**: Native mobile experience for lab environments
- **Two-Factor Authentication**: Enhanced security options
- **Rich Media Support**: Attach images and diagrams to recipes
- **Integration with Lab Equipment**: Direct export to lab instruments

## Development Practices
- **TypeScript**: Type safety throughout the codebase
- **Component Structure**: Modular, reusable UI components
- **Error Boundaries**: Graceful handling of runtime errors
- **Progressive Enhancement**: Core functionality works without JS
- **Accessibility**: ARIA compliance and keyboard navigation
- **Testing Strategy**: Unit tests for business logic, integration tests for flows

## Original User Request
Biotech recipe generator