const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false // By default, password field will not be returned in queries
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    }
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

// Pre-save hook: Before saving a user, hash the password if it has been modified
//this is a middleware function that runs before saving a user document to the database. It checks if the password field has been modified. If it has, it generates a salt and hashes the password using bcrypt before saving it to the database. This ensures that passwords are stored securely in a hashed format rather than in plain text.
userSchema.pre('save', async function () {
  // If the password field is not modified, move to the next middleware 
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10); //salt is a random string that is used to enhance the security of the hashed password.
  this.password = await bcrypt.hash(this.password, salt);
  
});

// Custom method: This method is used to compare the entered password with the hashed password stored in the database. It uses bcrypt's compare function to check if the entered password matches the hashed password. This is useful for authentication purposes, such as during login.
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;