import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";
import MDBox from "components/MDBox";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";
import ReportsLineChart from "examples/Charts/LineCharts/ReportsLineChart";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import reportsBarChartData from "layouts/dashboard/data/reportsBarChartData";
import reportsLineChartData from "layouts/dashboard/data/reportsLineChartData";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDzyazmm4OU65Ls-eHtIS4gU_Eryg50ayU",
  authDomain: "mdweb-f5cf9.firebaseapp.com",
  projectId: "mdweb-f5cf9",
  storageBucket: "mdweb-f5cf9.appspot.com",
  messagingSenderId: "977082720913",
  appId: "1:977082720913:web:913dc0cdc58d8fdcd89530",
  measurementId: "G-R67GH8J9KT",
};

const app = initializeApp(firebaseConfig);

function Dashboard() {
  const [totalConversations, setTotalConversations] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth(app);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        signOut(auth)
          .then(() => {
            navigate("/authentication/sign-in");
          })
          .catch((error) => {
            console.error("Error signing out:", error);
          });
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  useEffect(() => {
    if (!loading) {
      async function fetchTotalConversations() {
        try {
          const response = await fetch("http://chatbot-back:8080/conversations/total");
          if (!response.ok) {
            throw new Error("Unable to fetch the total conversations count");
          }
          const data = await response.json();
          setTotalConversations(data.total_conversations);
        } catch (error) {
          console.error(error);
        }
      }

      fetchTotalConversations();
    }
  }, [loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const { sales, tasks } = reportsLineChartData;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="dark"
                icon="sms"
                title="Total Conversations"
                count={totalConversations}
                percentage={{
                  color: "success",
                  amount: "+55%",
                  label: "than last week",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                icon="leaderboard"
                title="Today's Users"
                count="2,300"
                percentage={{
                  color: "success",
                  amount: "+3%",
                  label: "than last month",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="success"
                icon="euro"
                title="Consumption"
                count="34k"
                percentage={{
                  color: "success",
                  amount: "+1%",
                  label: "than yesterday",
                }}
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={3}>
            <MDBox mb={1.5}>
              <ComplexStatisticsCard
                color="primary"
                icon="error"
                title="Raised Errors"
                count="+91"
                percentage={{
                  color: "success",
                  amount: "",
                  label: "Just updated",
                }}
              />
            </MDBox>
          </Grid>
        </Grid>
        <MDBox mt={4.5}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <ReportsBarChart
                  color="info"
                  title="website views"
                  description="Last Campaign Performance"
                  date="campaign sent 2 days ago"
                  chart={reportsBarChartData}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <ReportsLineChart
                  color="success"
                  title="Conversations Rates"
                  description={
                    <>
                      (<strong>+15%</strong>) increase in today sales.
                    </>
                  }
                  date="updated 4 min ago"
                  chart={sales}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <ReportsLineChart
                  color="dark"
                  title="Raised Errors"
                  description="Last Campaign Performance"
                  date="just updated"
                  chart={tasks}
                />
              </MDBox>
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
    </DashboardLayout>
  );
}

export default Dashboard;
