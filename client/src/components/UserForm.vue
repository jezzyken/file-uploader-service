<template>
  <v-container>
    <!-- Add User Section -->
    <v-card class="mb-5">
      <v-card-title>Add User</v-card-title>
      <v-card-text>
        <v-form ref="userForm">
          <v-text-field
            v-model="newUser.name"
            label="Name"
            required
          ></v-text-field>
          <v-text-field
            v-model="newUser.email"
            label="Email"
            required
          ></v-text-field>
          <v-text-field
            v-model="documentTitle"
            label="Document Title"
          ></v-text-field>
          <v-file-input
            v-model="file"
            label="Choose File"
            accept="*/*"
          ></v-file-input>
          <v-btn @click="handleFileUpload" color="primary" class="mr-1">Upload File</v-btn>
          <v-btn @click="handleUserSave" color="secondary" class="mr-1">Save User</v-btn>
          <v-btn @click="cancelUpload" color="red">Cancel Upload</v-btn>
          <v-progress-linear class="my-3 " :value="uploadProgress" height="25">
            <strong>{{ uploadProgress }}%</strong>
          </v-progress-linear>

          <v-img
            v-if="filePreviewUrl"
            :src="filePreviewUrl"
            max-width="500"
            class="mt-4"
          ></v-img>
        </v-form>
      </v-card-text>
    </v-card>

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
                  <v-btn @click="viewUser(item._id)" color="primary"
                    >View</v-btn
                  >
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
              <v-list-item-title
                >Name: {{ selectedUser.name }}</v-list-item-title
              >
              <v-list-item-subtitle
                >Email: {{ selectedUser.email }}</v-list-item-subtitle
              >
            </v-list-item-content>
          </v-list-item>
          <v-list-item v-for="doc in selectedUser.documents" :key="doc._id">
            <v-list-item-content>
              <v-list-item-title>{{ doc.title }}</v-list-item-title>
              <v-list-item-subtitle>
                <a
                  :href="'http://localhost:4200/' + doc.content"
                  target="_blank"
                  >View Document</a
                >
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
      filePreviewUrl: null,
      uploadProgress: 0,
      uploading: false,
      uploadedDocumentId: null,
      uploadAbortController: null, 
      tempFileUrl: null 
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
    async handleFileUpload() {
      if (!this.file) {
        alert('Please choose a file to upload.');
        return;
      }

      const formData = new FormData();
      formData.append('document', this.file);
      formData.append('title', this.documentTitle);

      this.uploading = true;

      this.uploadAbortController = new AbortController();

      try {
        const response = await axios.post('http://localhost:4200/api/users/documents/temp-upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          signal: this.uploadAbortController.signal,
          onUploadProgress: progressEvent => {
            this.uploadProgress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          }
        });

        this.uploadedDocumentId = response.data._id; 
        this.tempFileUrl = response.data.tempFileUrl; 
        this.filePreviewUrl = `http://localhost:4200/uploads/${response.data.filename}`;
        console.log(response.data)

        alert('File uploaded temporarily');
      } catch (error) {
        if (error.name === 'CanceledError') {
          console.log('Upload canceled');
        } else {
          console.error('Error uploading file:', error);
          alert('Error uploading file');
        }
      } finally {
        this.uploading = false;
      }
    },
    async handleUserSave() {
      const userData = {
        name: this.newUser.name,
        email: this.newUser.email,
        documentId: this.uploadedDocumentId 
      };

      try {
        const response = await axios.post('http://localhost:4200/api/users', userData);
        this.users.push(response.data);
        this.$refs.userForm.reset();
        this.newUser = { name: '', email: '' };
        this.file = null;
        this.filePreviewUrl = null; 
        this.uploadedDocumentId = null; 
        this.tempFileUrl = null;
        this.documentTitle = '';
      } catch (error) {
        console.error('Error adding user:', error);
        alert('Error adding user');
      }
    },
    cancelUpload() {
      if (this.uploadAbortController) {
        this.uploadAbortController.abort();
      }

      if (this.uploadedDocumentId) {
        axios.delete(`http://localhost:4200/api/users/documents/temp-upload/${this.uploadedDocumentId}`);
      }

      this.file = null;
      this.filePreviewUrl = null; 
      this.uploadedDocumentId = null; 
      this.tempFileUrl = null; 
      this.uploading = false;
    },
    async viewUser(id) {
      try {
        const response = await axios.get(`http://localhost:4200/api/users/${id}`);
        this.selectedUser = response.data;
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    }
  }
};
</script>