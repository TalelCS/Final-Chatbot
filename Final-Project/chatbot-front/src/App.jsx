import React, { useState, useEffect, useRef } from 'react';
import {
    Typography,
    TextField,
    Container,
    createTheme,
    Box,
    Skeleton,
    IconButton,
    Avatar,
    Card,
    CardContent,
    Tooltip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Button,
    useMediaQuery,
    InputAdornment,
} from '@mui/material';
import { VolumeUp, Stop, FileCopy, Check, RestartAlt, ThumbDown, Send, Image, Mic, MicNone } from '@mui/icons-material';
import { marked } from 'marked';
import lottie from 'lottie-web';
import { defineElement } from '@lordicon/element';
import { MediaRecorder, register } from 'extendable-media-recorder';
import { connect } from 'extendable-media-recorder-wav-encoder';

defineElement(lottie.loadAnimation);

const theme = createTheme({
  palette: {
      mode: 'dark',
      background: {
          default: '#121212',
      },
      text: {
          primary: 'rgba(255, 255, 255, 0.87)',
      },
  },
  typography: {
      fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  },
});


const WS = new WebSocket("ws://localhost:8080/ws");

function App() {
    const [conversation, setConversation] = useState([]);
    const [question, setQuestion] = useState("");
    const containerRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [recording, setRecording] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [openUploadModal, setOpenUploadModal] = useState(false);
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const audioRef = useRef(null);
    const [transcription, setTranscription] = useState('');
    const recognitionRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    let audioContext = null;
    const audioChunks = useRef([]);
    const wsTranscribe = useRef(null);


    const WS_URL = "ws://chatbot-back:8080/ws";
    const WS_TRANSCRIBE_URL = "ws://chatbot-back:8080/ws/transcribe";

    const chatbotAvatarUrl = 'https://img.freepik.com/vecteurs-libre/robot-vectoriel-graident-ai_78370-4114.jpg?w=740&t=st=1719827044~exp=1719827644~hmac=b5b8fdc75259fa0f72c383a276fba40d6d39f58aaf5a7e6279dfa54cdda3ee35';


    const uploadMessage = async (message) => {
        const conversationData = {
            thread_id: "123457",
            conv: {
                ...(message.role === 'user' ? { [`user_input_${conversation.length + 1}`]: message.content } : {}),
                ...(message.role === 'bot' ? { [`bot_response_${conversation.length + 1}`]: message.content } : {}),
            },
            timestamp: new Date().toISOString(),
            has_problem: false
        };
    
        if (conversation.length > 0) {
            const lastMessage = conversation[conversation.length - 1];
            if (lastMessage.role === 'user' && message.role === 'bot') {
                conversationData.conv = { ...lastMessage.conv, ...conversationData.conv };
            }
        }
    
        try {
            let response;
            if (message.role === 'user') {
                console.log('Sending user input:', { user_input: message.content });
                response = await fetch(`https://localhost:8080/conversations/${conversationData.thread_id}/user_input`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ user_input: message.content })
                });
            } else if (message.role === 'bot') {
                response = await fetch(`https://localhost:8080/conversations/${conversationData.thread_id}/chatbot_response`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ bot_response: message.content })
                });
            }
    
            const result = await response.json();
            console.log(result);
        } catch (error) {
            console.error('Error uploading message:', error);
        }
    };

    useEffect(() => {

        WS.onopen = () => {
            fetch('https://xr6drp7b-5000.euw.devtunnels.ms/conversations', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                thread_id: "123457",
                conv: {},
                timestamp: new Date().toISOString(),
                has_problem: false
              })
            })
            .then(response => response.json())
            .then(result => console.log(result))
            .catch(error => console.error('Error creating conversation:', error));
          };

          WS.onmessage = (event) => {
            setLoading(false);
            const newResponse = event.data;
        
            if (newResponse === "__STREAM_END__") {
                setConversation(prevConversation => {
                    const lastMessage = prevConversation[prevConversation.length - 1];
        
                    if (lastMessage.role === 'bot' && !lastMessage.isComplete) {
                        const updatedMessage = { ...lastMessage, isComplete: true };

                        uploadMessage(updatedMessage);
        
                        return [...prevConversation.slice(0, -1), updatedMessage];
                    }
        
                    return prevConversation;
                });
                return;
            }
        
            setConversation(prevConversation => {
                const lastMessage = prevConversation[prevConversation.length - 1];
        
                if (lastMessage.role === 'bot' && !lastMessage.isComplete) {
                    const updatedContent = lastMessage.content + newResponse;
                    const updatedMessage = { ...lastMessage, content: updatedContent };
        
                    return [...prevConversation.slice(0, -1), updatedMessage];
                } else {
                    const newMessage = { role: 'bot', content: newResponse, isComplete: false };        
                    return [...prevConversation, newMessage];
                }
            });
        
            if (containerRef.current) {
                containerRef.current.scrollTop = containerRef.current.scrollHeight;
            }
        };        
  }, []);

    const handleSpeech = async (text) => {
        if (playing) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setPlaying(false);
        } else {
            const response = await fetch(`/tts?content=${encodeURIComponent(text)}`);
            const reader = response.body.getReader();
            const stream = new ReadableStream({
                start(controller) {
                    function push() {
                        reader.read().then(({ done, value }) => {
                            if (done) {
                                controller.close();
                                return;
                            }
                            console.log('Received chunk:', value);
                            controller.enqueue(value);
                            push();
                        });
                    }
                    push();
                }
            });

            const blob = await new Response(stream).blob();
            const url = URL.createObjectURL(blob);
            console.log('Audio URL:', url);
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.play();
            setPlaying(true);
            audio.onended = () => setPlaying(false);
        }
    };

    const markdownToHtml = (markdownText) => {
      return { __html: marked.parse(markdownText) };
  };

    const handleCopy = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 3000);
    };

    const handleRestart = () => {
        setConversation([]);
    };

    const handleDislike = () => {
    };

    const handleSend = (faqQuestion) => {
        const userQuestion = faqQuestion || question;
        if (userQuestion.trim() === "") {
            return;
        }
        setConversation(prevConversation => [...prevConversation, { role: 'user', content: userQuestion }]);
        setQuestion('');
        setLoading(true);
        WS.send(userQuestion);
        uploadMessage(userQuestion);
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    };

    const handleOpenUploadModal = () => {
        setOpenUploadModal(true);
    };

    const handleCloseUploadModal = () => {
        setOpenUploadModal(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const files = e.dataTransfer.files;
        handleFiles(files);
    };

    const handleFiles = (files) => {
        console.log(files);
    };

    const handleFileUpload = (e) => {
        const files = e.target.files;
        handleFiles(files);
    };

    const uploadWav = (blob) => {
      audioChunks.current.push(blob);
      if (wsTranscribe.current && wsTranscribe.current.readyState === WebSocket.OPEN) {
          wsTranscribe.current.send(blob);
          console.log("data available sending");
          console.log(blob.size, blob.type);
      }
  };

  const setupTranscribeWS = () => {
      if (!wsTranscribe.current || wsTranscribe.current.readyState === WebSocket.CLOSED) {
          wsTranscribe.current = new WebSocket(WS_TRANSCRIBE_URL);
          wsTranscribe.current.onmessage = handleTranscribeMessage;
          wsTranscribe.current.onclose = () => console.log("Transcribe WebSocket closed");
      }
  };

  const closeTranscribeWS = () => {
      if (wsTranscribe.current) {
          wsTranscribe.current.close();
          wsTranscribe.current = null;
      }
  };

  useEffect(() => {
      (async () => {
          await register(await connect());
      })();

      return () => {
          closeTranscribeWS();
      };
  }, []);

  const handleMicClick = () => {
      console.log("Mic icon clicked. Recording:", recording);
      if (recording) {
          stopRecording();
      } else {
          console.log("Starting recording...");
          setupTranscribeWS();
          startRecording();
      }
  };

  const startRecording = async () => {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      try {
          await audioContext.resume();
          console.log('Audio context resumed successfully.');
      } catch (e) {
          console.error('Failed to resume audio context:', e);
      }

      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorderRef.current = new MediaRecorder(stream, {
              mimeType: 'audio/wav',
              encoder: 'wav-encoder'
          });

          let header;

          mediaRecorderRef.current.addEventListener('dataavailable', async ({ data }) => {
              console.log(data);
              if (header === undefined) {
                  header = await data.slice(0, 44).arrayBuffer();
                  uploadWav(data);
              } else {
                  const content = await data.arrayBuffer();
                  const combinedData = new Uint8Array(header.byteLength + content.byteLength);
                  combinedData.set(new Uint8Array(header), 0);
                  combinedData.set(new Uint8Array(content), header.byteLength);

                  uploadWav(new Blob([combinedData], { type: data.type }));
              }
          });

          mediaRecorderRef.current.start(3000);
          setRecording(true);
          console.log('MediaRecorder started.');
      } catch (e) {
          console.error('Failed to start MediaRecorder:', e);
      }
  };

  const stopRecording = () => {
      setRecording(false);
      if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current = null;
          closeTranscribeWS();
      }
  };

  const handleTranscribeMessage = (event) => {
      const transcribedText = event.data;
      console.log("Received transcribed text:", transcribedText);
      setTranscription(prevTranscription => prevTranscription + transcribedText);
  };

    const renderMessage = (message, index) => {
        return (
            <Box key={index} sx={{ display: 'flex', alignItems: message.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 3, flexDirection: message.role === 'user' ? 'row-reverse' : 'row', mr:2}}>
                {message.role === 'bot' && <Avatar alt="Chatbot Avatar" src={chatbotAvatarUrl} sx={{ mr: 2 }} />}
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body1" sx={{ borderRadius: '25px', backgroundColor: '#333', color: '#fff', px: 2 }} dangerouslySetInnerHTML={markdownToHtml(message.content)} />
                    {message.role === 'bot' && (
                        <Box sx={{ display: 'flex', flexDirection: 'row', ml: 2 }}>
                            <Tooltip title={playing ? 'Arrêter' : 'Lire à haute voix'}>
                                <IconButton onClick={() => handleSpeech(message.content)} sx={{ mt: 1, mx: 0.5, width: 'fit-content', color:'#ffffff' }}>
                                      {playing ? <Stop fontSize="small" /> : <VolumeUp fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Copier">
                                <IconButton onClick={() => handleCopy(message.content, index)} sx={{ mt: 1, mx: 0.5, width: 'fit-content', color:'#ffffff' }}>
                                      {copiedIndex === index ? <Check fontSize="small" /> : <FileCopy fontSize="small" />}
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Régénérer">
                                <IconButton onClick={handleRestart} sx={{ mt: 1, mx: 0.5, width: 'fit-content', fontSize: '20px', color:'#ffffff' }}>
                                      <RestartAlt fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Mauvaise réponse">
                                <IconButton onClick={handleDislike} sx={{ mt: 1, mx: 0.5, width: 'fit-content', fontSize: '20px', color:'#ffffff' }}>
                                      <ThumbDown fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    )}
                </Box>
            </Box>
        );
    };

    const faqs = [
        "J'ai besoin d'une attestation",
        "Je souhaite annuler mon contrat",
        "J'ai un sinistre à déclarer",
        "Avez-vous une offre Caution ?"
    ];

    return (
      <Container disableGutters style={{ overflowY:'hidden', height: '100vh', flexGrow: 1,  display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems:'center', px: 0 }}>
      <Box ref={containerRef} sx={{flexGrow: 1, overflowY: 'auto', width: '80%', marginBottom:'90px'}}>
              {conversation.length === 0 ? (
                  <Card sx={{ borderRadius: '10px', textAlign: 'center', backgroundColor: '#1E1E1E', color:'#ffff'}}>
                      <CardContent>
                          <img src="https://studyassur.com/upload/content/images/partners/studyassur-logo.png" alt="studyassur-logo" style={{ maxWidth: '100px', marginBottom: '20px' }} />
                          <Typography variant="h6">
                              Hello ! Je suis votre assistant virtuel,<br />
                              comment puis-je vous aider ?
                          </Typography>
                      </CardContent>
                  </Card>
              ) : (
                  <img src="https://studyassur.com/upload/content/images/partners/studyassur-logo.png" alt="studyassur-logo" style={{ maxWidth: '100px', marginBottom: '20px' }} />
              )}
              <Box>{conversation.map((message, index) => renderMessage(message, index))}</Box>
                  {loading && (
                      <Box>
                          <Skeleton />
                          <Skeleton animation="wave" />
                          <Skeleton animation={false} />
                      </Box>
                  )}
          </Box>
          <Box sx={{ display:'flex', flexDirection: 'row-reverse', alignItems:'center', width: '80%', position: 'fixed', bottom: 0, pb: 2 ,backgroundImage: 'linear-gradient(0deg, rgba(18,18,18,1) 50%, rgba(0,212,255,0) 100%)'}}>
                  <Box sx={{ display:'flex', flexDirection: 'column', width:'100%'}}>
                  {conversation.length === 0 && (
                      <Box sx={{ width: '100%', display: 'flex', justifyContent: isMobile ? 'flex-start' : 'space-around',mb: 5, py: isMobile ? 2 : 0,overflowX: isMobile ? 'auto' : 'visible' }}>
                        {faqs.map((faq, index) => (
                            <Card key={index} onClick={() => handleSend(faq)} sx={{ minWidth: isMobile ? '70%' : '22%', borderRadius: '10px', cursor: 'pointer', mx: 1,backgroundColor: '#1E1E1E',color: '#ffff','&:hover': { boxShadow: 6, backgroundColor: '#615857' } }}>
                            <CardContent>
                                <Typography variant="body1">
                                {faq}
                                </Typography>
                            </CardContent>
                            </Card>
                        ))}
                      </Box>
                  )}
                  <Box sx={{ display:'flex', flexDirection: 'row-reverse', alignItems:'center'}}>
                      <TextField
                          id="outlined-basic"
                          label= {recording ? "Ecoute..." : "Posez-moi une question"}
                          variant="outlined"
                          value={question || transcription}
                          fullWidth
                          disabled={loading}
                          onChange={e => setQuestion(e.target.value)}
                          onKeyUp={e => {
                              if (e.key === "Enter" && question.trim() !== "") {
                                  handleSend();
                              }
                          }}
                          sx={{ borderRadius: '25px'}}
                          InputLabelProps={{
                            style: {
                              color: '#ffffff',
                            }
                          }}
                          InputProps={{
                              style: {
                                  borderRadius: '25px',
                                  backgroundColor: '#333',
                                  color: '#c8c8c8'
                              },
                              endAdornment: (
                                  <InputAdornment position="end">
                                      <IconButton onClick={handleMicClick} sx={{ color:'#ffffff'}}>
                                          {recording ? (
                                              <lord-icon
                                              src="https://cdn.lordicon.com/jibstvae.json"
                                              trigger="loop"
                                              state="loop-recording"
                                              colors="primary:#ffffff,secondary:#ffffff"
                                              style={{ width: '24px', height: '24px' }}
                                              />
                                          ) : (
                                              <lord-icon
                                              src="https://cdn.lordicon.com/jibstvae.json"
                                              trigger="in"
                                              delay="1500"
                                              state="in-reveal"
                                              colors="primary:#ffffff,secondary:#ffffff"
                                              style={{ width: '24px', height: '24px' }}
                                              />
                                          )}
                                      </IconButton>
                                      <IconButton onClick={handleOpenUploadModal} sx={{ color:'#ffffff'}}>
                                          <Image fontSize="small" />
                                      </IconButton>
                                      {question && (
                                          <IconButton onClick={() => handleSend(question)} sx={{ color:'#ffffff'}}>
                                              <Send fontSize="small" />
                                          </IconButton>
                                      )}
                                  </InputAdornment>
                              )
                          }}
                      />
                      <IconButton onClick={uploadConversation} sx={{height: '100%', display: 'flex', flexWrap: 'No-wrap', color:'#ffffff'}} >
                          <RestartAlt fontSize="small" />
                      </IconButton>
                  </Box>
              </Box>
          </Box>
          <Dialog 
              open={openUploadModal} 
              onClose={handleCloseUploadModal} 
              sx={{
                  '& .MuiDialog-paper': {
                      borderRadius: '15px',
                      padding: '20px',
                      backgroundColor: '#282c34',
                      color: '#fff',
                  }
              }}
          >
              <DialogTitle 
                  sx={{
                      fontWeight: 'bold',
                      fontSize: '1.5rem',
                      textAlign: 'center',
                      color: '#61dafb'
                  }}
              >
                  Upload Files
              </DialogTitle>
              <DialogContent>
                  <Box
                      sx={{
                          border: '2px dashed #61dafb',
                          borderRadius: '10px',
                          textAlign: 'center',
                          padding: '20px',
                          backgroundColor: '#333',
                          color: '#fff',
                          cursor: 'pointer',
                          '&:hover': {
                              backgroundColor: '#444',
                          },
                      }}
                      onDrop={handleDrop}
                      onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                      }}
                  >
                      <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="upload-file"
                          type="file"
                          onChange={handleFileUpload}
                      />
                      <label htmlFor="upload-file">
                          <Typography variant="body1" component="div">
                              Drag & Drop files here<br />or <br /> click to choose files
                          </Typography>
                      </label>
                  </Box>
              </DialogContent>
              <DialogActions sx={{ justifyContent: 'center', paddingTop: '20px' }}>
                  <Button onClick={handleCloseUploadModal}>
                      Cancel
                  </Button>
                  <Button onClick={handleCloseUploadModal} color="primary" variant="contained">
                      Upload
                  </Button>
              </DialogActions>
          </Dialog>
      </Container>
  );
}

export default App;
