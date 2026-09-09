import React from 'react'
import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  clientName?: string
  studioNames?: string[]
  message?: string
  searchUrl?: string
}

const Email = ({ clientName, studioNames, message, searchUrl }: Props) => {
  const studios = (studioNames ?? []).filter(Boolean)
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>We sent your project request to your selected design studio</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Your request is on its way</Heading>
          <Text style={text}>
            {clientName ? `Hi ${clientName},` : 'Hi there,'} thanks for using Intearior. We passed your
            project details on{studios.length ? ' to:' : '.'}
          </Text>
          {studios.length ? (
            <Section style={card}>
              {studios.map((s) => (
                <Text key={s} style={item}>
                  {s}
                </Text>
              ))}
            </Section>
          ) : null}
          <Text style={text}>
            Studios usually reply within one to three business days. If you don&apos;t hear back, you can
            always reach out to another studio.
          </Text>
          {message ? (
            <>
              <Hr style={hr} />
              <Text style={label}>What you sent</Text>
              <Text style={quote}>{message}</Text>
            </>
          ) : null}
          {searchUrl ? (
            <Button style={button} href={searchUrl}>
              Browse more studios
            </Button>
          ) : null}
          <Text style={footer}>Intearior — the independent interior design directory.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: 'We sent your project request',
  displayName: 'Enquiry confirmation (homeowner)',
  previewData: {
    clientName: 'Jane',
    studioNames: ['Studio Aurora', 'Copper & Oak Interiors'],
    message: 'Looking to redo our living room and kitchen this spring.',
    searchUrl: 'https://intearior.com/search',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px', maxWidth: '560px' }
const heading = { fontSize: '22px', margin: '0 0 12px', color: '#1c1917' }
const text = { fontSize: '15px', lineHeight: '24px', color: '#44403c' }
const card = { backgroundColor: '#faf9f7', borderRadius: '10px', padding: '12px 16px', margin: '12px 0' }
const item = { fontSize: '15px', margin: '4px 0', color: '#1c1917', fontWeight: 600 }
const label = { fontSize: '13px', color: '#78716c', margin: '0 0 4px', fontWeight: 700 }
const quote = { fontSize: '15px', lineHeight: '23px', color: '#44403c', margin: '0 0 12px' }
const hr = { borderColor: '#e7e5e4', margin: '18px 0' }
const button = {
  backgroundColor: '#1c1917',
  color: '#ffffff',
  borderRadius: '8px',
  padding: '11px 18px',
  fontSize: '14px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '12px', color: '#a8a29e', marginTop: '22px' }
