import React, { useState } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  PhoneOff, 
  User, 
  BookOpen, 
  Share2, 
  Terminal, 
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function VirtualClassModal({ booking, onClose }) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [codeSnippet, setCodeSnippet] = useState(
`# Welcome to your 1:1 Codeyoung Trial Class!
# Student: ${booking?.childName || 'Student'}
# Mentor: ${booking?.mentorTime?.mentorName || 'Mentor'}

def welcome_message():
    print("Welcome to live hands-on coding!")
    print("Let's build your first interactive program together.")

welcome_message()
`
  );

  if (!booking) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 35, 42, 0.75)',
      backdropFilter: 'blur(6px)',
      zIndex: 110,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.25rem'
    }}>
      <div style={{
        backgroundColor: '#163D4A',
        color: '#FFFFFF',
        width: '100%',
        maxWidth: '1000px',
        height: '85vh',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #2B5766'
      }}>
        {/* Header Bar */}
        <div style={{
          padding: '1rem 1.5rem',
          backgroundColor: '#0F2C36',
          borderBottom: '1px solid #2B5766',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <VideoIcon size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800 }}>
                Codeyoung Live Classroom (Demo Preview)
              </div>
              <div style={{ fontSize: '0.75rem', color: '#A0B8C0' }}>
                Course: {booking.subject?.title} • Booking: {booking.bookingId}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor: '#1E4D40',
              color: '#34D399',
              padding: '0.2rem 0.6rem',
              borderRadius: '20px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34D399' }} />
              Live Connected (1:1)
            </span>

            <button
              onClick={onClose}
              style={{ color: '#A0B8C0', padding: '0.25rem' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Classroom Center Grid */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: '1rem',
          padding: '1rem',
          overflow: 'hidden'
        }}>
          {/* Left Column: Video Feeds */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Mentor Tile */}
            <div style={{
              flex: 1,
              backgroundColor: '#0F2C36',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #2B5766',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '4.5rem',
                height: '4.5rem',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#FFFFFF',
                marginBottom: '0.5rem'
              }}>
                {booking.mentorTime?.mentorName ? booking.mentorTime.mentorName[0] : 'M'}
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>
                {booking.mentorTime?.mentorName || 'Assigned Mentor'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#34D399', marginTop: '0.2rem' }}>
                Speaking • Mic Connected
              </div>

              <div style={{
                position: 'absolute',
                bottom: '0.65rem',
                left: '0.65rem',
                fontSize: '0.72rem',
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px'
              }}>
                Mentor (India)
              </div>
            </div>

            {/* Student Tile */}
            <div style={{
              height: '140px',
              backgroundColor: '#0F2C36',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #2B5766',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                borderRadius: '50%',
                backgroundColor: 'var(--color-orange)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                fontWeight: 800,
                color: '#FFFFFF',
                marginBottom: '0.35rem'
              }}>
                {booking.childName ? booking.childName[0] : 'S'}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                {booking.childName} (Student)
              </div>
              <div style={{ fontSize: '0.7rem', color: '#A0B8C0' }}>
                Your Video Feed
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Code Sandbox */}
          <div style={{
            backgroundColor: '#0F2C36',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #2B5766',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#091C23',
              borderBottom: '1px solid #2B5766',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#A0B8C0' }}>
                <Terminal size={14} color="var(--color-warm-yellow)" />
                <span>Shared Interactive Workspace</span>
              </div>
              <span style={{ color: '#34D399', fontSize: '0.72rem' }}>
                Live Sync Active
              </span>
            </div>

            <textarea
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              style={{
                flex: 1,
                width: '100%',
                backgroundColor: '#0F2C36',
                color: '#A7F3D0',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '0.88rem',
                lineHeight: 1.6,
                padding: '1rem',
                border: 'none',
                resize: 'none',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Classroom Controls Footer */}
        <div style={{
          padding: '0.85rem 1.5rem',
          backgroundColor: '#0F2C36',
          borderTop: '1px solid #2B5766',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ fontSize: '0.8rem', color: '#A0B8C0' }}>
            Dummy Classroom Preview (Simulated for Evaluation)
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setMicOn(!micOn)}
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                backgroundColor: micOn ? '#1E4D40' : '#8A2424',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={micOn ? 'Mute Mic' : 'Unmute Mic'}
            >
              {micOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>

            <button
              onClick={() => setCamOn(!camOn)}
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '50%',
                backgroundColor: camOn ? '#1E4D40' : '#8A2424',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={camOn ? 'Turn Camera Off' : 'Turn Camera On'}
            >
              {camOn ? <VideoIcon size={18} /> : <VideoOff size={18} />}
            </button>

            <button
              onClick={onClose}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#E85D5D',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <PhoneOff size={16} />
              <span>Leave Class</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
