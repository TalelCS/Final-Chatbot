import React, { useState, useEffect } from "react";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDBadge from "components/MDBadge";
import MDButton from "components/MDButton";

export default function useAuthorsTableData(fetchConversation, deleteConversation) {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    async function fetchConversations() {
      try {
        const response = await fetch("http://chatbot-back:8080/conversations");
        if (!response.ok) {
          throw new Error("Unable to fetch conversations");
        }
        const data = await response.json();
        setConversations(data);
      } catch (error) {
        console.error(error);
      }
    }

    fetchConversations();
  }, []);

  return {
    columns: [
      { Header: "Thread ID", accessor: "thread_id", width: "25%", align: "left" },
      { Header: "Timestamp", accessor: "timestamp", align: "left" },
      { Header: "Has Problem", accessor: "has_problem", align: "center" },
      { Header: "Actions", accessor: "actions", align: "center" },
    ],

    rows: conversations.map((conv) => ({
      thread_id: (
        <MDTypography component="a" href="#" variant="caption" color="text" fontWeight="medium">
          {conv.thread_id}
        </MDTypography>
      ),
      timestamp: (
        <MDTypography component="a" href="#" variant="caption" color="text" fontWeight="medium">
          {new Date(conv.timestamp).toLocaleString()}
        </MDTypography>
      ),
      has_problem: (
        <MDBox ml={-1}>
          <MDBadge
            badgeContent={conv.has_problem ? "Problematic" : "Normal"}
            color={conv.has_problem ? "danger" : "success"}
            variant="gradient"
            size="sm"
          />
        </MDBox>
      ),
      actions: (
        <MDBox display="flex" justifyContent="center" alignItems="center">
          <MDButton
            variant="contained"
            color="primary"
            onClick={() => fetchConversation(conv.thread_id)}
          >
            View
          </MDButton>
          <MDButton
            variant="contained"
            color="secondary"
            onClick={() => deleteConversation(conv.thread_id)}
            sx={{ ml: 2 }}
          >
            Delete
          </MDButton>
        </MDBox>
      ),
    })),
  };
}
