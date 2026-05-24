# FYP-FireBomba-Admin

### This the admin dashboard for our final year project

## To Run this project

```git init```

```git clone https://github.com/Daryl711/FYP-FireBomba-Admin.git```

Locate to the directory that contains the repository that you have downloaded.

### Reminder:
please do ```git pull``` everytimes before you start to develop.

#### Very Important: 
Must turn on **MySQL** and **Apache** in XAMPP

### Frontend:

```cd frontend```

Install dependencies:

``` npm install ```

**❗IMPORTANT:** 
Please create an .env file that contains the following:

```EXPO_PUBLIC_API_URL=http://localhost:3000```

#### To run:
``` npm run dev```


### Backend:
#### Prerequiste:
Must download XAMPP in your laptop.

#### Steps to Setup Database in localhost:
1. Start Apache and MySQL in the XAMPP
2. Open the admin page by using localhost/phpmyadmin
3. Go to the IMPORT tab, and import the sql file that is contained in backend > sql > database.sql.

Then navigate to your backend using:

```cd backend```

Install dependencies:

```npm install```

Then run by using:

```npm run start```