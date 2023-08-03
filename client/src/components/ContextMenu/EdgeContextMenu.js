import * as React from "react";
import Paper from "@mui/material/Paper";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import DeleteIcon from "@mui/icons-material/Delete";

const EdgeContextMenu = ({ selectedEdge, deleteEdge, onClose }) => {
    const handleDeleteEdge = () => {
        deleteEdge(selectedEdge);
        onClose();
    };
    return (
        <Paper sx={{ width: 140, maxWidth: "100%" }}>
            <MenuList>
                <MenuItem onClick={handleDeleteEdge}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>엣지 제거</ListItemText>
                </MenuItem>
            </MenuList>
        </Paper>
    );
};

export default EdgeContextMenu;
