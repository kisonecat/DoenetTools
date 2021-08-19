<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: access');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Credentials: true');
header('Content-Type: application/json');

include 'db_connection.php';

$jwtArray = include 'jwtArray.php';
$userId = $jwtArray['userId'];
$allowed = false;

if (array_key_exists('doenetId', $_REQUEST)) {
    $doenetId = mysqli_real_escape_string($conn, $_REQUEST['doenetId']);

    //get driveId from doenetId
    //TODO: should be a sql join query with userId
    $sql = "
        SELECT driveId, parentFolderId
        FROM drive_content
        WHERE doenetId = '$doenetId'
    ";
    $result = $conn->query($sql);
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $driveId = $row['driveId'];
        $parentFolderId = $row['parentFolderId'];
    }

    if (
        array_key_exists('driveId', get_defined_vars()) &&
        array_key_exists('parentFolderId', get_defined_vars())
    ) {
        //check user has permission to view
        $sql = "
            SELECT canViewDrive
            FROM drive_user
            WHERE userId = '$userId'
            AND driveId = '$driveId'
        ";
        $result = $conn->query($sql);
        if ($result->num_rows > 0) {
            $row = $result->fetch_assoc();
            $allowed = $row['canViewDrive'];
            if (!$allowed) {
                http_response_code(403); //User if forbidden from operation
                echo json_encode([
                    'message' => 'User lacks permission',
                ]);
            }
        } else {
            //Fail because there is no DB row for the user on this drive so we shouldn't allow an add
            http_response_code(401); //User has bad auth
            echo json_encode([
                'message' => 'User Unauthorized',
            ]);
        }
    } else {
        http_response_code(400);
        echo json_encode(['message' => 'doenetId Invalid']);
    }
} else {
    http_response_code(400);
    echo json_encode(['message' => 'Missing DoenetId']);
}

if ($allowed) {
    http_response_code(200);
    echo json_encode([
        'driveId' => $driveId,
        'parentFolderId' => $parentFolderId,
        'message' => '',
    ]);
}

$conn->close();
?>