import Paper from "@mui/material/Paper";
import MenuList from "@mui/material/MenuList";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import DeleteIcon from "@mui/icons-material/Delete";

import useSelectedObjectStore from "../../store/SelectedObjectStore";

const TextContextMenu = ({ onClose, deleteNode }) => {
    const { selectedNode } = useSelectedObjectStore();

    const handleDeleteNode = () => {
        deleteNode(selectedNode);
        onClose();
    };

    return (
        <Paper sx={{ width: 140, maxWidth: "100%", zIndex: 15, position: "fixed" }}>
            <MenuList>
                <MenuItem onClick={handleDeleteNode}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>텍스트 제거</ListItemText>
                </MenuItem>
            </MenuList>
        </Paper>
    );
};

export default TextContextMenu;
