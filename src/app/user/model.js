const {nanoid} = require("nanoid");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { sequelize, Sequelize: { DataTypes, Model } } = require("../../helper/database");
const {  secrets: {nanoidLength, saltRounds, jwtSecret} } = require("../../helper/config");

// JSON fields stored as string in database.
const STRING_IN_DB = ["links", "bio"];

class User extends Model{ 
    
    // Instance Methods

    generateHashedPassword(){
        this.hashedPassword = bcrypt.hashSync(this.hashedPassword, saltRounds);
    };

    generateDefaultAvatar(){
        const userInitials = this.fullName.split(" ").map(word => word.charAt(0)).join("");
        this.image = `https://avatars.dicebear.com/api/initials/${userInitials}.svg`;
    };

    generateAuthToken(){
        return jwt.sign(this.toJSON(), jwtSecret, {expiresIn: "1d"});
    };

    /** 
    * @param {Array} of all Keys of the User object
    */
    convertToJSON(...args){
        for(const prop in this.toJSON()){
            args.forEach((arg) => {
                this[prop] = arg === prop ? JSON.parse(this[prop]) : this[prop];                
            });
        };
    };

    /** 
    * @param {Array} of all Keys of the User object
    */
    convertToString(...args){
        for(const prop in this.toJSON()){
            args.forEach((arg) => {
                this[prop] = arg === prop ? JSON.stringify(this[prop]) : this[prop];                
            });
        };
    };
    /**
     * @param  {String} password to compare
     */
    async authenticateUser({password}){
        const valid = await bcrypt.compare(password, this.hashedPassword); 
        return valid;
    }

    // Static Methods
    
}

User.init({
    userId: {
        type: DataTypes.STRING(40),
        primaryKey: true,
        defaultValue: () => nanoid(nanoidLength),
        allowNull: false,
    },
    fullName: {
        type: DataTypes.STRING,
        allowNull: false,
    },  
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
            msg: "Username already exists!"
        },
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
            msg: "Email already exists!"
        },
        validate: {
            isEmail: true
        }
    },
    links: {
        type: DataTypes.TEXT("medium"),
        allowNull: false,
        defaultValue: "{\"instagram\":\"\",\"linkedin\":\"\",\"twitter\":\"\"}"
    },
    bio: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
        defaultValue: "{\"headline\":\"\",\"about\":\"\"}",
    },
    image: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "https://avatars.dicebear.com/api/initials/•.svg`"
    },
    hashedPassword: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "",
    },
    registeredAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    lastLogin: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    modelName: "test_user_details",
    createdAt: "registeredAt",
    updatedAt: "lastLogin",
    timestamps: false,
    hooks: {
        beforeSave: (user) => {
            const isNewUser = user.lastLogin.toString() === user.registeredAt.toString()
            if(!isNewUser) return;
            user.generateDefaultAvatar();
            user.generateHashedPassword();
            user.convertToString(STRING_IN_DB);
        },
        afterSave: (user) => {
            user.convertToJSON(STRING_IN_DB);
        },
    },
});

module.exports = User;