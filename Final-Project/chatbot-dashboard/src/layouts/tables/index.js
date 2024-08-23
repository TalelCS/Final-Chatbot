import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDModal from "components/MDModal";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";
import useAuthorsTableData from "layouts/tables/data/authorsTableData";

function Tables() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const fetchConversation = async (conversationId) => {
    try {
      const response = await fetch(`http://chatbot-back:8080/conversations/${conversationId}`);
      if (!response.ok) {
        throw new Error("Conversation not found");
      }
      const conversation = await response.json();
      setSelectedConversation(conversation.conv);
      setIsModalOpen(true);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteConversation = async (conversationId) => {
    try {
      const response = await fetch(`http://chatbot-back:8080/conversations/${conversationId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete conversation");
      }
      setConversations(conversations.filter((conv) => conv.thread_id !== conversationId));
    } catch (error) {
      console.error(error);
    }
  };

  const { columns, rows } = useAuthorsTableData(fetchConversation, deleteConversation);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedConversation(null);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDModal
        open={isModalOpen}
        handleClose={handleCloseModal}
        conversation={selectedConversation}
      />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
              >
                <MDTypography variant="h6" color="white">
                  Conversations
                </MDTypography>
              </MDBox>
              <MDBox pt={3}>
                <DataTable
                  table={{ columns, rows }}
                  isSorted={false}
                  entriesPerPage={false}
                  showTotalEntries={false}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

export default Tables;
