import * as React from "react";
import Stack from "@mui/material/Stack";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

export default function InformationToast(props) {
    const handleClose = (event, reason) => {
        if (reason === "clickaway") {
            return;
        }
        props.visible(false);
    };

    return (
        <Stack spacing={1} sx={{ width: "100%" }}>
            <Snackbar open={props.open} autoHideDuration={3000} onClose={handleClose}>
                <Alert severity="info" sx={{ width: "100%" }}>
                    {props.message}
                </Alert>
            </Snackbar>
        </Stack>
    );
}
