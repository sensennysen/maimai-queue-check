import { useState, useEffect } from 'react';
import { Tabs } from '@mantine/core';
import { IconUsers, IconKey } from '@tabler/icons-react';
import UserTable from './UserTable';
import AccessRequests from './AccessRequests';
import './UserManager.css';

const UserManager = ({ isSuperAdmin, currentUserRoles, initialTab }) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'users');


  return (
    <Tabs value={activeTab} onChange={setActiveTab}>
      <Tabs.List>
        <Tabs.Tab value="users" leftSection={<IconUsers size={16} />}>
          Manage Users
        </Tabs.Tab>
        <Tabs.Tab value="requests" leftSection={<IconKey size={16} />}>
          Access Requests
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="users" pt="md">
        <UserTable isSuperAdmin={isSuperAdmin} currentUserRoles={currentUserRoles} />
      </Tabs.Panel>

      <Tabs.Panel value="requests" pt="md">
        <AccessRequests
          isSuperAdmin={isSuperAdmin}
          currentUserRoles={currentUserRoles}
          keyProp={activeTab}
        />
      </Tabs.Panel>
    </Tabs>
  );
};

export default UserManager;
