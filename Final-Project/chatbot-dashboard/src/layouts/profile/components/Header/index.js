import { useState, useEffect } from "react";

import PropTypes from "prop-types";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";

import breakpoints from "assets/theme/base/breakpoints";

import { getAuth } from "firebase/auth";

function Header({ children }) {
  const [tabsOrientation, setTabsOrientation] = useState("horizontal");
  const [userPhoto, setUserPhoto] = useState("");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserPhoto(user.photoURL || "");
        setUserName(user.displayName || "");
        setUserEmail(user.email || "");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    function handleTabsOrientation() {
      return window.innerWidth < breakpoints.values.sm
        ? setTabsOrientation("vertical")
        : setTabsOrientation("horizontal");
    }

    window.addEventListener("resize", handleTabsOrientation);

    handleTabsOrientation();

    return () => window.removeEventListener("resize", handleTabsOrientation);
  }, [tabsOrientation]);

  return (
    <MDBox position="relative" mb={5}>
      <Card
        sx={{
          position: "relative",
          mt: 1,
          mx: 3,
          py: 2,
          px: 2,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <MDAvatar src={userPhoto} alt="profile-image" size="xl" shadow="sm" />
          </Grid>
          <Grid item>
            <MDBox height="100%" mt={0.5} lineHeight={1}>
              <MDTypography variant="h5" fontWeight="medium">
                {userName}
              </MDTypography>
              <MDTypography variant="button" color="text" fontWeight="regular">
                {userEmail}
              </MDTypography>
            </MDBox>
          </Grid>
        </Grid>
        {children}
      </Card>
    </MDBox>
  );
}

Header.defaultProps = {
  children: "",
};

Header.propTypes = {
  children: PropTypes.node,
};

export default Header;
