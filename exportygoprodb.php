<?php
//remove limits on: execution time, memory usage
ini_set('max_execution_time', 0);
ini_set('memory_limit', '-1');

//create connection
echo 'var db = {';
$servername = "localhost";
$username = "root";
$password = "";
$conn = new mysqli($servername, $username, $password);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
mysqli_select_db($conn, "ygosimhelper");

function dequote($txt) {return str_replace('"', '\\"', $txt);}
function deline($txt) {return str_replace(array("\r\n", "\r", "\n"), "\\n", $txt);}
$result = $conn->query("SELECT * FROM datas");
while($row = $result->fetch_assoc()) {
	$id = $row["id"];
	$ot = $row["ot"];
	$alias = $row["alias"];
	$setcode = $row["setcode"];
	$type = $row["type"];
	$atk = $row["atk"];
	$def = $row["def"];
	$level = $row["level"];
	$race = $row["race"];
	$attribute = $row["attribute"];
	$category = $row["category"];
	
	//name, description, str1-16
	$textRes = $conn->query("SELECT * FROM texts WHERE id='$id' LIMIT 1");
	$textData = $textRes->fetch_assoc();
	$name = dequote($textData["name"]);
	$desc = $textData["description"];
	
	//add strs to desc
	$str = "";
	$i = 1;
	while ($i <= 16) {
		$key = "str" . $i;
		$i++;
		$val = $textData[$key];
		if ($val == '' || $val == ' ') continue;
		$str = $str . $val . "`";
	}
	$str = rtrim($str, "`");
	$textRes->free_result();
	
	$desc = $desc . "~" .  $str;
	$desc = dequote(deline($desc));
	
	echo $id . ': ["' . $name . '", "' . $desc . '", ' . $ot . ', ' . $alias . ', ' . $setcode . ', ' . $type . ', ' . $atk . ', ' . $def . ', ' . $level . ', ' . $race . ', ' . $attribute . ', ' . $category . '],';
}
$result->free_result();

echo '};';

?>
