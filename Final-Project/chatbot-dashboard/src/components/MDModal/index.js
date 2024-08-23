import React from "react";
import PropTypes from "prop-types";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "80%",
  maxWidth: 600,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

function MDModal({ open, handleClose, conversation }) {
  const renderConversation = (conversation) => {
    const messages = [];
    let counter = 1;

    while (conversation[`user_input_${counter}`] || conversation[`bot_response_${counter + 1}`]) {
      if (conversation[`user_input_${counter}`]) {
        messages.push(
          <Grid container justifyContent="flex-end" key={`user_input_${counter}`} sx={{ mb: 1 }}>
            <Grid item xs={10} md={8}>
              <Box sx={{ p: 2, bgcolor: "grey.100", color: "white", borderRadius: 2 }}>
                <Typography variant="body1">
                  <strong>User:</strong> {conversation[`user_input_${counter}`]}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        );
      }
      if (conversation[`bot_response_${counter + 1}`]) {
        messages.push(
          <Grid
            container
            justifyContent="flex-start"
            key={`bot_response_${counter + 1}`}
            sx={{ mb: 2 }}
          >
            <Grid item xs={10} md={8}>
              <Box sx={{ p: 2, bgcolor: "grey.200", borderRadius: 2 }}>
                <Typography variant="body1">
                  <strong>Bot:</strong> {conversation[`bot_response_${counter + 1}`]}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        );
      }
      counter += 2;
    }

    return messages;
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Box sx={{ display: "flex", flexDirection: "row", width: "100%" }}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Conversation Details
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton size="small" disableRipple color="inherit" onClick={handleClose}>
            <Icon fontSize="medium">{"close"}</Icon>
          </IconButton>
        </Box>
        <Box sx={{ maxHeight: "calc(100vh - 200px)", overflowY: "scroll", mt: 1 }}>
          {conversation ? (
            renderConversation(conversation)
          ) : (
            <Typography>No conversation data available.</Typography>
          )}
        </Box>
        <Button onClick={handleClose} sx={{ mt: 2 }}>
          Close
        </Button>
      </Box>
    </Modal>
  );
}

MDModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  conversation: PropTypes.object,
};

export default MDModal;
