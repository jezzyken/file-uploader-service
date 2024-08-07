<template>
  <v-container>
    <!-- Add User Section -->
    <v-card class="mb-5">
      <v-card-title>Add User</v-card-title>
      <v-card-text>
        <v-form ref="userForm" @submit.prevent="addUserWithDocument">
          <v-text-field v-model="newUser.name" label="Name" required></v-text-field>
          <v-text-field v-model="newUser.email" label="Email" required></v-text-field>
          <v-text-field v-model="documentTitle" label="Document Title" required></v-text-field>
          <v-file-input v-model="file" label="Choose File" accept="*/*" required></v-file-input>
          <v-btn type="submit" color="primary">Add User</v-btn>
        </v-form>
      </v-card-text>
    </v-card>

    <!-- Update User Section -->
    <v-card class="mb-5" v-if="selectedUser">
      <v-card-title>Update User</v-card-title>
      <v-card-text>
        <v-form ref="updateForm" @submit.prevent="onUpdateUser">
          <v-text-field v-model="updateUser.name" label="Name" required></v-text-field>
          <v-text-field v-model="updateUser.email" label="Email" required></v-text-field>
          <v-text-field v-model="updateDocumentTitle" label="Document Title"></v-text-field>
          <v-file-input v-model="updateFile" label="Choose File"></v-file-input>
          <v-btn type="submit" color="primary">Update User</v-btn>
        </v-form>
      </v-card-text>
    </v-card>


    <!-- User Profile Section -->
    <v-card class="mb-5">
      <v-card-title>User Profiles</v-card-title>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="users"
          item-key="id"
          class="elevation-1"
        >
          <template v-slot:body="{ items }">
            <tbody>
              <tr v-for="item in items" :key="item._id">
                <td>{{ item.name }}</td>
                <td>{{ item.email }}</td>
                <td>
                  <v-btn @click="viewUser(item._id)" color="primary">View</v-btn>
                </td>
              </tr>
            </tbody>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- User Details Section -->
    <v-card v-if="selectedUser">
      <v-card-title>User Details</v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title>Name: {{ selectedUser.name }}</v-list-item-title>
              <v-list-item-subtitle>Email: {{ selectedUser.email }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
          <v-list-item v-for="doc in selectedUser.documents" :key="doc._id">
            <v-list-item-content>
              <v-list-item-title>{{ doc.title }}</v-list-item-title>
              <v-list-item-subtitle>
                <a :href="'http://localhost:4200/' + doc.content" target="_blank">View Document</a>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      headers: [
        { text: 'Name', value: 'name' },
        { text: 'Email', value: 'email' },
        { text: 'Actions', value: 'actions', sortable: false }
      ],
      users: [],
      selectedUser: null,
      newUser: {
        name: '',
        email: ''
      },
      documentTitle: '',
      file: null,
      updateUser: {
        name: '',
        email: ''
      },
      updateDocumentTitle: '',
      updateFile: null
    };
  },
  created() {
    this.fetchUsers();
  },
  methods: {
    async fetchUsers() {
      try {
        const response = await axios.get('http://localhost:4200/api/users');
        this.users = response.data;
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    },
    async addUserWithDocument() {
      if (!this.file) return;
      const formData = new FormData();
      formData.append('name', this.newUser.name);
      formData.append('email', this.newUser.email);
      formData.append('title', this.documentTitle);
      formData.append('document', this.file);

      try {
        const response = await axios.post('http://localhost:4200/api/users', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        this.users.push(response.data);
        this.$refs.userForm.reset();
        this.newUser = { name: '', email: '' };
        this.documentTitle = '';
        this.file = null;
      } catch (error) {
        console.error('Error adding user and document:', error);
        alert('Error adding user and document');
      }
    },
    async onUpdateUser() {
      if (!this.selectedUser) return;
      const formData = new FormData();
      formData.append('name', this.updateUser.name);
      formData.append('email', this.updateUser.email);
      if (this.updateFile) {
        formData.append('title', this.updateDocumentTitle);
        formData.append('document', this.updateFile);
      }

      try {
        const response = await axios.put(`http://localhost:4200/api/users/${this.selectedUser._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const index = this.users.findIndex(user => user._id === response.data._id);
        this.$set(this.users, index, response.data);
        this.$refs.updateForm.reset();
        this.updateUser = { name: '', email: '' };
        this.updateDocumentTitle = '';
        this.updateFile = null;
        this.selectedUser = null; 
      } catch (error) {
        console.error('Error updating user:', error);
        alert('Error updating user');
      }
    },
    async viewUser(id) {
      try {
        const response = await axios.get(`http://localhost:4200/api/users/${id}`);
        this.selectedUser = response.data;
        this.updateUser = { name: this.selectedUser.name, email: this.selectedUser.email };
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    }
  }
};
</script>
