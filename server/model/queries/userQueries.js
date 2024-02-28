const userQuery = {
    GET_USER: "SELECT * FROM user WHERE username = ?;",
    POST_USER: "INSERT INTO user (email, password, created_at, username) VALUES (?,?,Now(),?);",
    POST_ROLE: "INSERT INTO user_roles (user_id, role_id) VALUES (LAST_INSERT_ID(), 2);",
    GET_ROLE: "SELECT * FROM user_roles WHERE user_id = ?",
};

module.exports = userQuery;
