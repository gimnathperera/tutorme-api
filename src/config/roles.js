const allRoles = {
  user: [],
  tutor: ['manageBlog'],
  admin: ['getUsers', 'manageUsers', 'manageBlog'],
};

const roles = Object.keys(allRoles);

const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
