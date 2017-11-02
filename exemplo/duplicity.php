<?php

include_once '../../connect/class.connect_firebird.php';
extract($_POST);

$con = ConexaoFirebird::getConectar(12);


$sql = "SELECT FIRST 1 " . $param['field'] . " FROM " . $param['table'] .
        " WHERE " . $param['field'] . " = '" . $param['value'] . "'";


$pdo = $con->prepare($sql);
$pdo->execute();

$rs = $pdo->fetchAll(PDO::FETCH_OBJ);
echo json_encode($rs);


