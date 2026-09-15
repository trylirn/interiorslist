import React from 'react'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  contactName?: string
  studioName?: string
  actionUrl?: string
}

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 25px', maxWidth: '560px' }
const heading = { fontSize: '20px', color: '#1a1a1a', marginBottom: '12px' }
const text = { fontSize: '14px', color: '#444444', lineHeight: '22px' }
const button = {
  backgroundColor: '#1a1a1a',
  color: '#ffffff',
  fontSize: '14px',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
}
const footer = { fontSize: '13px', color: '#777777', marginTop: '24px' }

const greeting = (name?: string) => (name ? `Hi ${name},` : 'Hello,')

function Shell({
  preview,
  title,
  body,
  actionUrl,
  actionLabel,
}: {
  preview: string
  title: string
  body: React.ReactNode
  actionUrl?: string
  actionLabel: string
}) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>{title}</Heading>
          {body}
          {actionUrl ? (
            <Button style={button} href={actionUrl}>
              {actionLabel}
            </Button>
          ) : null}
          <Text style={footer}>— The Intearior team</Text>
        </Container>
      </Body>
    </Html>
  )
}

const SubmissionReceived = ({ contactName, studioName, actionUrl }: Props) => (
  <Shell
    preview={`We received your listing request for ${studioName ?? 'your studio'}`}
    title="We've received your studio"
    actionUrl={actionUrl}
    actionLabel="Open your dashboard"
    body={
      <>
        <Text style={text}>{greeting(contactName)}</Text>
        <Text style={text}>
          Thanks for submitting <strong>{studioName ?? 'your studio'}</strong> to Intearior. Our team
          reviews and verifies every new studio — usually within 1–2 business days — and we'll email
          you as soon as it's live.
        </Text>
        <Text style={text}>
          In the meantime you can sign in to your dashboard to follow the status of your submission.
        </Text>
      </>
    }
  />
)

const SubmissionApproved = ({ contactName, studioName, actionUrl }: Props) => (
  <Shell
    preview={`${studioName ?? 'Your studio'} is live on Intearior`}
    title="Your studio is live"
    actionUrl={actionUrl}
    actionLabel="Complete your studio details"
    body={
      <>
        <Text style={text}>{greeting(contactName)}</Text>
        <Text style={text}>
          Good news — <strong>{studioName ?? 'your studio'}</strong> has been approved and is now
          listed on Intearior.
        </Text>
        <Text style={text}>
          Please take a few minutes to complete your details: a short description, your services and
          design styles, project photos, business hours and the email address where you'd like new
          client enquiries sent. Complete profiles get far more enquiries.
        </Text>
      </>
    }
  />
)

const previewData = {
  contactName: 'Jane Miller',
  studioName: 'Atelier Rowe',
  actionUrl: 'https://intearior.com/dashboard',
}

export const submissionReceived = {
  component: SubmissionReceived,
  subject: (d: Record<string, any>) => `We received your listing for ${d.studioName ?? 'your studio'}`,
  displayName: 'Studio submission received',
  previewData,
} satisfies TemplateEntry

export const submissionApproved = {
  component: SubmissionApproved,
  subject: (d: Record<string, any>) => `${d.studioName ?? 'Your studio'} is live on Intearior`,
  displayName: 'Studio submission approved',
  previewData,
} satisfies TemplateEntry
