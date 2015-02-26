package nuclibook.server;

import com.j256.ormlite.jdbc.JdbcConnectionSource;
import com.j256.ormlite.support.ConnectionSource;
import com.j256.ormlite.table.TableUtils;
import nuclibook.constants.C;
import nuclibook.models.*;
import org.apache.commons.configuration.ConfigurationException;
import org.apache.commons.configuration.PropertiesConfiguration;
import org.jasypt.encryption.pbe.StandardPBEStringEncryptor;

import java.sql.SQLException;
import java.util.HashMap;

public class SqlServerConnection {

    private static String uriString = "database.URI";
    private static String usernameString = "database.user.name";
    private static String passwordString = "database.user.password";
    private static String uriKey = "URI";
    private static String usernameKey = "userName";
    private static String passwordKey = "password";

	/* singleton pattern */

	private SqlServerConnection() {
	}

	private static ConnectionSource connection = null;

	public static ConnectionSource acquireConnection() {
		if (connection == null) {
			try {
                HashMap<String,String> dbProperties = getDatabaseProperties();
				connection = new JdbcConnectionSource(dbProperties.get(uriKey));
				((JdbcConnectionSource) connection).setUsername(dbProperties.get(usernameString));
				((JdbcConnectionSource) connection).setPassword(dbProperties.get(passwordKey));
				initDB(connection);
			} catch (Exception e) {
				e.printStackTrace(); // TODO deal with exception
			}
		}

		return connection;
	}

    private static HashMap<String, String> getDatabaseProperties() throws ConfigurationException {
        HashMap<String, String> dbPropertiesMap = new HashMap<String, String>();
        PropertiesConfiguration config = new PropertiesConfiguration("database.properties");
        dbPropertiesMap.put(uriKey , config.getString(uriString));
        dbPropertiesMap.put(usernameKey , config.getString(usernameString));
        dbPropertiesMap.put(passwordKey , decryptPassword(config.getString(passwordString)));

        return dbPropertiesMap;
    }

    //method which decrypts the password
    private static String decryptPassword(String encryptedString) {

        StandardPBEStringEncryptor encryptor = new StandardPBEStringEncryptor();
        encryptor.setPassword("jasypt");
        String decryptedString = encryptor.decrypt(encryptedString);

        return decryptedString;
    }

    public static void initDB(ConnectionSource connection) {
		try {
			TableUtils.createTableIfNotExists(connection, ActionLog.class);
			TableUtils.createTableIfNotExists(connection, Booking.class);
			TableUtils.createTableIfNotExists(connection, BookingStaff.class);
			TableUtils.createTableIfNotExists(connection, Camera.class);
			TableUtils.createTableIfNotExists(connection, CameraType.class);
			TableUtils.createTableIfNotExists(connection, Medicine.class);
			TableUtils.createTableIfNotExists(connection, Patient.class);
			TableUtils.createTableIfNotExists(connection, Permission.class);
			TableUtils.createTableIfNotExists(connection, Staff.class);
			TableUtils.createTableIfNotExists(connection, StaffAbsence.class);
			TableUtils.createTableIfNotExists(connection, StaffAvailability.class);
			TableUtils.createTableIfNotExists(connection, StaffRole.class);
			TableUtils.createTableIfNotExists(connection, StaffRolePermission.class);
			TableUtils.createTableIfNotExists(connection, Therapy.class);
		} catch (SQLException e) {
			e.printStackTrace(); // TODO deal with exception
		}
	}
}
